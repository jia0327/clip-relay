const DEFAULT_TTL_MS = 30 * 60 * 1000; // 30 minutes

class RoomManager {
  constructor() {
    // token -> { createdAt, ttlMs: number (0 = permanent), expired: bool, connections: Map }
    this.rooms = new Map();
  }

  getOrCreate(token, ttlMinutes) {
    let room = this.rooms.get(token);
    if (!room) {
      const ttlMs = ttlMinutes === 0 ? 0 : (ttlMinutes || 30) * 60 * 1000;
      room = { createdAt: Date.now(), ttlMs, expired: false, connections: new Map() };
      this.rooms.set(token, room);
    }
    return room;
  }

  get(token) {
    return this.rooms.get(token);
  }

  isExpired(token) {
    const room = this.rooms.get(token);
    if (!room) return false;
    if (room.expired) return true;
    if (room.ttlMs === 0) return false; // 永久房间
    if (Date.now() - room.createdAt >= room.ttlMs) {
      room.expired = true;
      return true;
    }
    return false;
  }

  getExpiresIn(token) {
    const room = this.rooms.get(token);
    if (!room) return Math.floor(DEFAULT_TTL_MS / 1000);
    if (room.expired) return 0;
    if (room.ttlMs === 0) return -1; // -1 表示永久
    const remaining = room.ttlMs - (Date.now() - room.createdAt);
    return Math.max(0, Math.floor(remaining / 1000));
  }

  addConnection(token, ws, deviceType) {
    const room = this.getOrCreate(token);
    if (room.expired) return false;
    room.connections.set(ws, { deviceType, joinedAt: Date.now() });
    return true;
  }

  removeConnection(token, ws) {
    const room = this.rooms.get(token);
    if (!room) return null;
    const info = room.connections.get(ws);
    room.connections.delete(ws);
    return info;
  }

  broadcast(token, sender, data) {
    const room = this.rooms.get(token);
    if (!room) return;
    const payload = JSON.stringify(data);
    for (const [ws] of room.connections) {
      if (ws !== sender && ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }

  broadcastAll(token, data) {
    const room = this.rooms.get(token);
    if (!room) return;
    const payload = JSON.stringify(data);
    for (const [ws] of room.connections) {
      if (ws.readyState === 1) {
        ws.send(payload);
      }
    }
  }

  notifyDeviceJoined(token, sender, deviceType) {
    this.broadcast(token, sender, { type: 'device_joined', device_type: deviceType });
  }

  notifyDeviceLeft(token, sender, deviceType) {
    this.broadcast(token, sender, { type: 'device_left', device_type: deviceType });
  }

  getConnectionCount(token) {
    const room = this.rooms.get(token);
    return room ? room.connections.size : 0;
  }

  getDeviceTypes(token) {
    const room = this.rooms.get(token);
    if (!room) return [];
    const types = [];
    for (const [, info] of room.connections) {
      types.push(info.deviceType);
    }
    return types;
  }

  cleanupExpired() {
    const expired = [];
    for (const [token, room] of this.rooms) {
      if (room.expired) continue;
      if (room.ttlMs === 0) continue; // 永久房间不清理
      if (Date.now() - room.createdAt >= room.ttlMs) {
        room.expired = true;
        for (const [ws] of room.connections) {
          try {
            ws.send(JSON.stringify({ type: 'room_expired' }));
            ws.close(4001, 'Room expired');
          } catch (_) {}
        }
        room.connections.clear();
        expired.push(token);
      }
    }
    return expired;
  }
}

module.exports = { RoomManager, DEFAULT_TTL_MS };
