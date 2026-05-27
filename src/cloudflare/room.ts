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
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket upgrade', { status: 426 });
    }

    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response('Missing token', { status: 400 });
    }

    const { 0: clientWs, 1: serverWs } = new WebSocketPair();

    serverWs.addEventListener('message', (event) => {
      this.handleMessage(token, serverWs, event.data.toString());
    });

    this.ctx.acceptWebSocket(serverWs);

    await this.scheduleAlarm(token);

    return new Response(null, { status: 101, webSocket: clientWs });
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

        let roomCfg = this.getRoomConfig(token);
        if (!roomCfg) {
          this.createRoom(token, '临时房间', 30);
          roomCfg = this.getRoomConfig(token);
        }

        if (roomCfg && roomCfg.disabled) {
          this.send(ws, { type: 'error', message: '房间已停用，请联系管理员' });
          ws.close(4002, 'Room disabled');
          return;
        }

        const messages = this.getRoomMessages(token);
        const expiresIn = this.getExpiresIn(token);

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
        this.deleteRoomMessages(token);
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

        const record = this.addMessage(token, msg.content);
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

        const record = this.addImageMessage(token, msg.content, msg.filename || 'image.png');
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
    const room = this.getRoomConfig(token);
    if (!room || room.disabled) return;

    const ttl = room.ttl_minutes || 30;
    if (ttl <= 0) return;

    const created = new Date(room.created_at).getTime();
    const expires = created + ttl * 60 * 1000;
    const delay = Math.max(expires - Date.now(), 1000);

    try {
      await this.ctx.storage.setAlarm(delay);
    } catch (e) {
      console.error('Failed to set alarm:', e);
    }
  }

  async alarm() {
    const websockets = this.getAllWebSockets();
    if (websockets.length === 0) {
      console.log('Room expired, connections empty');
    }
  }

  private getRoomConfig(token: string) {
    return this.env.DB.prepare('SELECT * FROM rooms WHERE token = ?').get(token) as any;
  }

  private createRoom(token: string, name: string, ttlMinutes: number) {
    const createdAt = new Date().toISOString();
    this.env.DB.prepare(`
      INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, disabled)
      VALUES (?, ?, ?, ?, 0)
    `).run(token, name, ttlMinutes, createdAt);
  }

  private getRoomMessages(token: string, limit = 100) {
    const rows = this.env.DB.prepare(
      'SELECT * FROM messages WHERE room_token = ? ORDER BY id DESC LIMIT ?'
    ).all(token, limit);
    return (rows.results || []).reverse();
  }

  private addMessage(roomToken: string, content: string) {
    const createdAt = new Date().toISOString();
    const result = this.env.DB.prepare(
      'INSERT INTO messages (room_token, content, msg_type, created_at) VALUES (?, ?, ?, ?)'
    ).run(roomToken, content, 'text', createdAt);

    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: 'text',
      created_at: createdAt
    };
  }

  private addImageMessage(roomToken: string, content: string, filename: string) {
    const createdAt = new Date().toISOString();
    const result = this.env.DB.prepare(
      'INSERT INTO messages (room_token, content, msg_type, filename, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(roomToken, content, 'image', filename, createdAt);

    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: 'image',
      filename,
      created_at: createdAt
    };
  }

  private deleteRoomMessages(roomToken: string) {
    this.env.DB.prepare('DELETE FROM messages WHERE room_token = ?').run(roomToken);
  }

  private getExpiresIn(token: string): number {
    const room = this.getRoomConfig(token);
    if (!room) return 0;

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