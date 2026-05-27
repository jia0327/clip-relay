import { DurableObject } from 'cloudflare:workers';
import type { D1Database } from '@cloudflare/workers-types';

export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface Connection {
  ws: WebSocket;
  deviceType: string;
}

export class Room implements DurableObject {
  private connections: Map<WebSocket, Connection> = new Map();

  constructor(
    private ctx: DurableObjectState,
    private env: Env
  ) {
    this.ctx.setWebSocketAutoResponse(true);
  }

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

    serverWs.addEventListener('close', () => {
      this.removeConnection(token, serverWs);
    });

    serverWs.addEventListener('error', () => {
      this.removeConnection(token, serverWs);
    });

    this.ctx.acceptWebSocket(serverWs);
    this.connections.set(serverWs, { ws: serverWs, deviceType: 'desktop' });

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
        const conn = this.connections.get(ws);
        if (conn) conn.deviceType = deviceType;

        let roomCfg = await this.getRoomConfig(token);
        if (!roomCfg) {
          await this.createRoom(token, '临时房间', 30);
          roomCfg = await this.getRoomConfig(token);
        }

        if (roomCfg && roomCfg.disabled) {
          this.send(ws, { type: 'error', message: '房间已停用，请联系管理员' });
          ws.close(4002, 'Room disabled');
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
          online_count: this.connections.size,
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

  private send(ws: WebSocket, data: any) {
    ws.send(JSON.stringify(data));
  }

  private broadcastAll(data: any) {
    const msg = JSON.stringify(data);
    for (const conn of this.connections.values()) {
      conn.ws.send(msg);
    }
  }

  private broadcastExcluding(exclude: WebSocket, data: any) {
    const msg = JSON.stringify(data);
    for (const [ws, conn] of this.connections) {
      if (ws !== exclude) ws.send(msg);
    }
  }

  private getDeviceTypes(): string[] {
    const types = new Set<string>();
    for (const conn of this.connections.values()) {
      types.add(conn.deviceType);
    }
    return Array.from(types);
  }

  private async removeConnection(token: string, ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (conn) {
      this.connections.delete(ws);
      this.broadcastAll({ type: 'device_left', device_type: conn.deviceType });

      if (this.connections.size === 0) {
        await this.scheduleAlarm(token);
      }
    }
  }

  private async scheduleAlarm(token: string) {
    const room = await this.getRoomConfig(token);
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
    if (this.connections.size === 0) {
      console.log('Room expired, connections empty');
    }
  }

  private async getRoomConfig(token: string) {
    return await this.env.DB.prepare('SELECT * FROM rooms WHERE token = ?').first(token) as any;
  }

  private async createRoom(token: string, name: string, ttlMinutes: number) {
    const createdAt = new Date().toISOString();
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, disabled)
      VALUES (?, ?, ?, ?, 0)
    `).run(token, name, ttlMinutes, createdAt);
  }

  private async getRoomMessages(token: string, limit = 100) {
    const rows = await this.env.DB.prepare(
      'SELECT * FROM messages WHERE room_token = ? ORDER BY id DESC LIMIT ?'
    ).all(token, limit);
    return (rows.results || []).reverse();
  }

  private async addMessage(roomToken: string, content: string) {
    const createdAt = new Date().toISOString();
    const result = await this.env.DB.prepare(
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

  private async addImageMessage(roomToken: string, content: string, filename: string) {
    const createdAt = new Date().toISOString();
    const result = await this.env.DB.prepare(
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

  private async deleteRoomMessages(roomToken: string) {
    await this.env.DB.prepare('DELETE FROM messages WHERE room_token = ?').run(roomToken);
  }

  private async getExpiresIn(token: string): Promise<number> {
    const room = await this.getRoomConfig(token);
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