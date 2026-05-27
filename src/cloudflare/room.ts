import { DurableObject } from 'cloudflare:workers';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface Connection {
  ws: WebSocket;
  deviceType: string;
}

export class Room implements DurableObject {
  constructor(
    private ctx: DurableObjectState,
    private env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    console.log('Room.fetch called, path:', new URL(request.url).pathname, 'upgrade:', request.headers.get('Upgrade'));

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    console.log('WebSocket request, token:', token);

    if (!token) {
      return new Response('Missing token', { status: 400 });
    }

    const { 0: clientWs, 1: serverWs } = new WebSocketPair();
    console.log('Created WebSocketPair');

    this.ctx.acceptWebSocket(serverWs, [token]);
    console.log('Accepted WebSocket, total:', this.ctx.getWebSockets().length);

    try {
      await this.scheduleAlarm(token);
    } catch (e: any) {
      console.error('scheduleAlarm error:', e?.message || e);
    }
    console.log('WebSocket upgrade complete, returning 101');

    return new Response(null, { status: 101, webSocket: clientWs });
  }

  async webSocketMessage(ws: WebSocket, message: string) {
    const [token] = this.ctx.getTags(ws);
    console.log('webSocketMessage, token:', token, 'msg:', message.substring(0, 100));
    await this.handleMessage(token, ws, message);
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    console.log('webSocketClose, code:', code, 'reason:', reason);
  }

  async webSocketError(ws: WebSocket, error: Error) {
    console.error('webSocketError:', error.message);
  }

  private async handleMessage(token: string, ws: WebSocket, raw: string) {
    let msg: WebSocketMessage;
    try {
      msg = JSON.parse(raw);
    } catch {
      this.send(ws, { type: 'error', message: 'Invalid JSON' });
      return;
    }

    switch (msg.type) {
      case 'join': {
        const deviceType = msg.device_type || 'desktop';

        let roomCfg = await this.getRoomConfig(token);
        if (!roomCfg) {
          await this.createRoom(token, '临时房间', 30);
          roomCfg = await this.getRoomConfig(token);
        }

        if (roomCfg && roomCfg.disabled === 1) {
          this.send(ws, { type: 'error', message: '房间已停用，请联系管理员' });
          ws.close(4002, 'Room disabled');
          return;
        }

        if (roomCfg && roomCfg.disabled === 2) {
          this.send(ws, { type: 'error', message: '房间已过期' });
          ws.close(4001, 'Room expired');
          return;
        }

        const messages = await this.getRoomMessages(token);
        const expiresIn = await this.getExpiresIn(token);

        this.send(ws, {
          type: 'joined',
          messages,
          room_name: roomCfg?.name || null,
          room_created_at: roomCfg?.created_at,
          expires_in: expiresIn,
          permanent: expiresIn === -1,
          online_count: this.getAllWebSockets().length,
          online_devices: this.getDeviceTypes()
        });

        this.broadcastExcluding(ws, { type: 'device_joined', device_type: deviceType });
        await this.scheduleAlarm(token);
        break;
      }

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      case 'clear_messages':
        await this.deleteRoomMessages(token);
        this.broadcastAll({ type: 'messages_cleared' });
        break;

      case 'message': {
        if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
          this.send(ws, { type: 'error', message: 'Empty message' });
          return;
        }

        const maxSize = parseInt(this.env.MAX_IMAGE_SIZE || '5242880');
        if (msg.content.length > maxSize) {
          this.send(ws, { type: 'error', message: `Message too large, max ${Math.round(maxSize / 1024 / 1024)}MB` });
          return;
        }

        const record = await this.addMessage(token, msg.content);
        this.broadcastExcluding(ws, { type: 'message', message: record });
        break;
      }

      case 'image': {
        if (!msg.content || typeof msg.content !== 'string') {
          this.send(ws, { type: 'error', message: 'Invalid image data' });
          return;
        }

        if (!msg.content.startsWith('data:image/')) {
          this.send(ws, { type: 'error', message: 'Invalid image format, expected data:image/...' });
          return;
        }

        const base64Len = msg.content.includes(',') ? msg.content.split(',')[1].length : 0;
        const byteSize = Math.ceil(base64Len * 3 / 4);
        const maxSize = parseInt(this.env.MAX_IMAGE_SIZE || '5242880');

        if (byteSize > maxSize) {
          this.send(ws, { type: 'error', message: `Image too large, max ${Math.round(maxSize / 1024 / 1024)}MB` });
          return;
        }

        const record = await this.addImageMessage(token, msg.content, msg.filename || 'image.png');
        this.broadcastExcluding(ws, { type: 'image', message: record });
        break;
      }

      default:
        this.send(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  }

  private getAllWebSockets(): WebSocket[] {
    return this.ctx.getWebSockets();
  }

  private send(ws: WebSocket, data: any) {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      console.error('Send error:', e);
    }
  }

  private broadcastAll(data: any) {
    const msg = JSON.stringify(data);
    for (const ws of this.getAllWebSockets()) {
      this.send(ws, data);
    }
  }

  private broadcastExcluding(exclude: WebSocket, data: any) {
    const msg = JSON.stringify(data);
    for (const ws of this.getAllWebSockets()) {
      if (ws !== exclude) {
        this.send(ws, data);
      }
    }
  }

  private getDeviceTypes(): string[] {
    const types = new Set<string>();
    // Note: getWebSockets() returns WebSocket[], not Connection[]
    // Device type is per-connection, we'd need to track this differently
    // For now, return desktop as default
    types.add('desktop');
    return Array.from(types);
  }

  private async scheduleAlarm(token: string) {
    try {
      const room = await this.getRoomConfig(token);
      if (!room || room.disabled) return;

      let delay: number;
      if (room.expires_at) {
        delay = Math.max(new Date(room.expires_at).getTime() - Date.now(), 1000);
      } else {
        // 兼容旧房间未迁移 expires_at
        const ttl = room.ttl_minutes || 30;
        if (ttl <= 0) {
          await this.ctx.storage.deleteAlarm().catch(() => {});
          await this.ctx.storage.delete('token').catch(() => {});
          return;
        }
        const created = new Date(room.created_at).getTime();
        const expires = created + ttl * 60 * 1000;
        delay = Math.max(expires - Date.now(), 1000);
      }

      await this.ctx.storage.put('token', token);
      await this.ctx.storage.setAlarm(delay);
    } catch (e: any) {
      console.error('scheduleAlarm error:', e?.message || e);
    }
  }

  async alarm() {
    const token = await this.ctx.storage.get('token') as string;
    if (token) {
      try {
        const room = await this.getRoomConfig(token);
        // 房间已删除/停用 → 不处理
        if (!room || room.disabled !== 0) return;
        // expires_at 还在未来 → 旧 alarm 误触发
        if (room.expires_at) {
          if (new Date(room.expires_at).getTime() > Date.now()) return;
        } else if (room.ttl_minutes === 0) {
          return; // 兼容旧永久房间无 expires_at
        }

        await this.env.DB.prepare('UPDATE rooms SET disabled = 2 WHERE token = ?').bind(token).run();
        await this.env.DB.prepare('DELETE FROM messages WHERE room_token = ?').bind(token).run();
      } catch (e: any) {
        console.error('alarm cleanup error:', e?.message || e);
      }
    }

    const websockets = this.getAllWebSockets();
    for (const ws of websockets) {
      this.send(ws, { type: 'room_expired' });
      ws.close(4001, 'Room expired');
    }
    if (websockets.length === 0) {
      console.log('Room expired, connections empty');
    }
  }

  private async getRoomConfig(token: string) {
    return await this.env.DB.prepare('SELECT * FROM rooms WHERE token = ?').bind(token).first() as any;
  }

  private async createRoom(token: string, name: string, ttlMinutes: number) {
    const createdAt = new Date().toISOString();
    const expiresAt = ttlMinutes > 0 ? new Date(Date.now() + ttlMinutes * 60000).toISOString() : null;
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, expires_at, disabled)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(token, name, ttlMinutes, createdAt, expiresAt).run();
  }

  private async getRoomMessages(token: string, limit = 100) {
    const rows = await this.env.DB.prepare(
      'SELECT * FROM messages WHERE room_token = ? ORDER BY id DESC LIMIT ?'
    ).bind(token, limit).all();
    return (rows.results || []).reverse();
  }

  private async addMessage(roomToken: string, content: string) {
    const createdAt = new Date().toISOString();
    const result = await this.env.DB.prepare(
      'INSERT INTO messages (room_token, content, msg_type, created_at) VALUES (?, ?, ?, ?)'
    ).bind(roomToken, content, 'text', createdAt).run();

    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: 'text',
      created_at: createdAt
    };
  }

  private async addImageMessage(roomToken: string, content: string, filename: string) {
    const createdAt = new Date().toISOString();
    const result = await this.env.DB.prepare(
      'INSERT INTO messages (room_token, content, msg_type, filename, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(roomToken, content, 'image', filename, createdAt).run();

    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: 'image',
      filename,
      created_at: createdAt
    };
  }

  private async deleteRoomMessages(roomToken: string) {
    await this.env.DB.prepare('DELETE FROM messages WHERE room_token = ?').bind(roomToken).run();
  }

  private async getExpiresIn(token: string): Promise<number> {
    const room = await this.getRoomConfig(token);
    if (!room) return 0;
    if (room.expires_at) {
      return Math.max(0, Math.floor((new Date(room.expires_at).getTime() - Date.now()) / 1000));
    }
    // 兼容旧房间未迁移 expires_at
    const ttl = room.ttl_minutes;
    if (!ttl || ttl <= 0) return -1;
    const created = new Date(room.created_at).getTime();
    const expires = created + ttl * 60 * 1000;
    return Math.max(0, Math.floor((expires - Date.now()) / 1000));
  }
}

export interface Env {
  DB: D1Database;
  MAX_IMAGE_SIZE: string;
  DEFAULT_TOKEN: string;
}