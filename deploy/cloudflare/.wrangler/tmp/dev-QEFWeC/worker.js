var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../../src/cloudflare/room.ts
var Room = class {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }
  static {
    __name(this, "Room");
  }
  async fetch(request) {
    console.log("Room.fetch called, path:", new URL(request.url).pathname, "upgrade:", request.headers.get("Upgrade"));
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    console.log("WebSocket request, token:", token);
    if (!token) {
      return new Response("Missing token", { status: 400 });
    }
    const { 0: clientWs, 1: serverWs } = new WebSocketPair();
    console.log("Created WebSocketPair");
    this.ctx.acceptWebSocket(serverWs, [token]);
    console.log("Accepted WebSocket, total:", this.ctx.getWebSockets().length);
    try {
      await this.scheduleAlarm(token);
    } catch (e) {
      console.error("scheduleAlarm error:", e?.message || e);
    }
    console.log("WebSocket upgrade complete, returning 101");
    return new Response(null, { status: 101, webSocket: clientWs });
  }
  async webSocketMessage(ws, message) {
    const [token] = this.ctx.getTags(ws);
    console.log("webSocketMessage, token:", token, "msg:", message.substring(0, 100));
    await this.handleMessage(token, ws, message);
  }
  async webSocketClose(ws, code, reason, wasClean) {
    console.log("webSocketClose, code:", code, "reason:", reason);
  }
  async webSocketError(ws, error) {
    console.error("webSocketError:", error.message);
  }
  async handleMessage(token, ws, raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      this.send(ws, { type: "error", message: "Invalid JSON" });
      return;
    }
    switch (msg.type) {
      case "join": {
        const deviceType = msg.device_type || "desktop";
        const roomCfg = await this.getRoomConfig(token);
        if (!roomCfg) {
          this.send(ws, { type: "error", message: "\u623F\u95F4\u4E0D\u5B58\u5728\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458\u83B7\u53D6\u6709\u6548\u94FE\u63A5" });
          ws.close(4003, "Room not found");
          return;
        }
        if (roomCfg.disabled === 1) {
          this.send(ws, { type: "error", message: "\u623F\u95F4\u5DF2\u505C\u7528\uFF0C\u8BF7\u8054\u7CFB\u7BA1\u7406\u5458" });
          ws.close(4002, "Room disabled");
          return;
        }
        if (roomCfg.disabled === 2) {
          this.send(ws, { type: "error", message: "\u623F\u95F4\u5DF2\u8FC7\u671F" });
          ws.close(4001, "Room expired");
          return;
        }
        const messages = await this.getRoomMessages(token);
        const expiresIn = await this.getExpiresIn(token);
        this.send(ws, {
          type: "joined",
          messages,
          room_name: roomCfg?.name || null,
          room_created_at: roomCfg?.created_at,
          expires_in: expiresIn,
          permanent: expiresIn === -1,
          online_count: this.getAllWebSockets().length,
          online_devices: this.getDeviceTypes()
        });
        this.broadcastExcluding(ws, { type: "device_joined", device_type: deviceType });
        await this.scheduleAlarm(token);
        break;
      }
      case "ping":
        this.send(ws, { type: "pong" });
        break;
      case "clear_messages":
        await this.deleteRoomMessages(token);
        this.broadcastAll({ type: "messages_cleared" });
        break;
      case "message": {
        if (!msg.content || typeof msg.content !== "string" || msg.content.trim().length === 0) {
          this.send(ws, { type: "error", message: "Empty message" });
          return;
        }
        const maxSize = parseInt(this.env.MAX_IMAGE_SIZE || "5242880");
        if (msg.content.length > maxSize) {
          this.send(ws, { type: "error", message: `Message too large, max ${Math.round(maxSize / 1024 / 1024)}MB` });
          return;
        }
        const record = await this.addMessage(token, msg.content);
        this.broadcastExcluding(ws, { type: "message", message: record });
        break;
      }
      case "image": {
        if (!msg.content || typeof msg.content !== "string") {
          this.send(ws, { type: "error", message: "Invalid image data" });
          return;
        }
        if (!msg.content.startsWith("data:image/")) {
          this.send(ws, { type: "error", message: "Invalid image format, expected data:image/..." });
          return;
        }
        const base64Len = msg.content.includes(",") ? msg.content.split(",")[1].length : 0;
        const byteSize = Math.ceil(base64Len * 3 / 4);
        const maxSize = parseInt(this.env.MAX_IMAGE_SIZE || "5242880");
        if (byteSize > maxSize) {
          this.send(ws, { type: "error", message: `Image too large, max ${Math.round(maxSize / 1024 / 1024)}MB` });
          return;
        }
        const record = await this.addImageMessage(token, msg.content, msg.filename || "image.png");
        this.broadcastExcluding(ws, { type: "image", message: record });
        break;
      }
      default:
        this.send(ws, { type: "error", message: `Unknown message type: ${msg.type}` });
    }
  }
  getAllWebSockets() {
    return this.ctx.getWebSockets();
  }
  send(ws, data) {
    try {
      ws.send(JSON.stringify(data));
    } catch (e) {
      console.error("Send error:", e);
    }
  }
  broadcastAll(data) {
    const msg = JSON.stringify(data);
    for (const ws of this.getAllWebSockets()) {
      this.send(ws, data);
    }
  }
  broadcastExcluding(exclude, data) {
    const msg = JSON.stringify(data);
    for (const ws of this.getAllWebSockets()) {
      if (ws !== exclude) {
        this.send(ws, data);
      }
    }
  }
  getDeviceTypes() {
    const types = /* @__PURE__ */ new Set();
    types.add("desktop");
    return Array.from(types);
  }
  async scheduleAlarm(token) {
    try {
      const room = await this.getRoomConfig(token);
      if (!room || room.disabled) return;
      let delay;
      if (room.expires_at) {
        delay = Math.max(new Date(room.expires_at).getTime() - Date.now(), 1e3);
      } else {
        const ttl = room.ttl_minutes || 30;
        if (ttl <= 0) {
          await this.ctx.storage.deleteAlarm().catch(() => {
          });
          await this.ctx.storage.delete("token").catch(() => {
          });
          return;
        }
        const created = new Date(room.created_at).getTime();
        const expires = created + ttl * 60 * 1e3;
        delay = Math.max(expires - Date.now(), 1e3);
      }
      await this.ctx.storage.put("token", token);
      await this.ctx.storage.setAlarm(delay);
    } catch (e) {
      console.error("scheduleAlarm error:", e?.message || e);
    }
  }
  async alarm() {
    const token = await this.ctx.storage.get("token");
    if (token) {
      try {
        const room = await this.getRoomConfig(token);
        if (!room || room.disabled !== 0) return;
        if (room.expires_at) {
          if (new Date(room.expires_at).getTime() > Date.now()) return;
        } else if (room.ttl_minutes === 0) {
          return;
        }
        await this.env.DB.prepare("UPDATE rooms SET disabled = 2 WHERE token = ?").bind(token).run();
        await this.env.DB.prepare("DELETE FROM messages WHERE room_token = ?").bind(token).run();
      } catch (e) {
        console.error("alarm cleanup error:", e?.message || e);
      }
    }
    const websockets = this.getAllWebSockets();
    for (const ws of websockets) {
      this.send(ws, { type: "room_expired" });
      ws.close(4001, "Room expired");
    }
    if (websockets.length === 0) {
      console.log("Room expired, connections empty");
    }
  }
  async getRoomConfig(token) {
    return await this.env.DB.prepare("SELECT * FROM rooms WHERE token = ?").bind(token).first();
  }
  async createRoom(token, name, ttlMinutes) {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const expiresAt = ttlMinutes > 0 ? new Date(Date.now() + ttlMinutes * 6e4).toISOString() : null;
    await this.env.DB.prepare(`
      INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, expires_at, disabled)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(token, name, ttlMinutes, createdAt, expiresAt).run();
  }
  async getRoomMessages(token, limit = 100) {
    const rows = await this.env.DB.prepare(
      "SELECT * FROM messages WHERE room_token = ? ORDER BY id DESC LIMIT ?"
    ).bind(token, limit).all();
    return (rows.results || []).reverse();
  }
  async addMessage(roomToken, content) {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.env.DB.prepare(
      "INSERT INTO messages (room_token, content, msg_type, created_at) VALUES (?, ?, ?, ?)"
    ).bind(roomToken, content, "text", createdAt).run();
    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: "text",
      created_at: createdAt
    };
  }
  async addImageMessage(roomToken, content, filename) {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    const result = await this.env.DB.prepare(
      "INSERT INTO messages (room_token, content, msg_type, filename, created_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(roomToken, content, "image", filename, createdAt).run();
    return {
      id: result.meta.last_row_id,
      room_token: roomToken,
      content,
      msg_type: "image",
      filename,
      created_at: createdAt
    };
  }
  async deleteRoomMessages(roomToken) {
    await this.env.DB.prepare("DELETE FROM messages WHERE room_token = ?").bind(roomToken).run();
  }
  async getExpiresIn(token) {
    const room = await this.getRoomConfig(token);
    if (!room) return 0;
    if (room.expires_at) {
      return Math.max(0, Math.floor((new Date(room.expires_at).getTime() - Date.now()) / 1e3));
    }
    const ttl = room.ttl_minutes;
    if (!ttl || ttl <= 0) return -1;
    const created = new Date(room.created_at).getTime();
    const expires = created + ttl * 60 * 1e3;
    return Math.max(0, Math.floor((expires - Date.now()) / 1e3));
  }
};

// ../../src/cloudflare/static_pages.ts
var INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
<meta name="color-scheme" content="dark light">
<title>ClipRelay \xB7 \u526A\u8D34\u677F\u63A5\u529B</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  color-scheme: light;
  --bg: #e9eaed;
  --surface: #ffffff;
  --surface-hover: #f8f9fb;
  --border: #e4e7ed;
  --text: #1e1f24;
  --text-secondary: #868b96;
  --text-muted: #a6aab2;
  --accent: #4f6ef6;
  --accent-light: #eef1fe;
  --accent-hover: #3d5de0;
  --accent-gradient: linear-gradient(135deg, #4f6ef6 0%, #7b5cf0 100%);
  --success: #10b981;
  --danger: #ef4444;
  --warning: #f59e0b;
  --radius-sm: 6px;
  --radius: 12px;
  --radius-lg: 18px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.04);
  --shadow: 0 2px 8px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.04);
  --code-bg: #f1f5f9;
  --highlight-bg: #eef1fe;
  --bubble-self: #95ec69;
  --bubble-self-text: #1a1a1a;
  --bubble-self-hover: #85d85a;
  --bubble-other: #c8d8f0;
  --transition: .2s cubic-bezier(.4,0,.2,1);
}

[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0d0f14;
  --surface: #161820;
  --surface-hover: #1c1e28;
  --border: #282b35;
  --text: #e3e5ec;
  --text-secondary: #8d919e;
  --text-muted: #5e6270;
  --accent: #6b8af7;
  --accent-light: #1a2040;
  --accent-hover: #8ba4f9;
  --accent-gradient: linear-gradient(135deg, #6b8af7 0%, #9080f0 100%);
  --success: #34d399;
  --danger: #f87171;
  --warning: #fbbf24;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.2);
  --shadow: 0 2px 8px rgba(0,0,0,.3), 0 1px 2px rgba(0,0,0,.2);
  --shadow-lg: 0 8px 24px rgba(0,0,0,.4);
  --code-bg: #1e2030;
  --highlight-bg: #1a2040;
  --bubble-self: #1e4620;
  --bubble-self-text: #c8e6c9;
  --bubble-self-hover: #255428;
  --bubble-other: #1e2d45;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans SC", sans-serif;
  background: var(--bg);
  color: var(--text);
  height: 100dvh;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  position: fixed;
  inset: 0;
}

/* scrollbar */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--text-muted); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-secondary); }

/* --- \u9876\u90E8\u680F --- */
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
}
.header-left { display: flex; align-items: center; gap: 10px; }
.logo {
  font-weight: 800;
  font-size: 16px;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -.5px;
}
.room-token {
  font-family: "SF Mono", "Fira Code", monospace;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--bg);
  padding: 3px 10px;
  border-radius: 20px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border: 1px solid var(--border);
}
.header-right { display: flex; align-items: center; gap: 10px; }
.status-badge {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: .2px;
}
.status-badge.active { background: #ecfdf5; color: #059669; }
.status-badge.expiring { background: #fffbeb; color: #d97706; }
.status-badge.expired { background: #fef2f2; color: #dc2626; }
[data-theme="dark"] .status-badge.active { background: #064e3b; color: #34d399; }
[data-theme="dark"] .status-badge.expiring { background: #451a03; color: #fbbf24; }
[data-theme="dark"] .status-badge.expired { background: #450a0a; color: #f87171; }
.online-count {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}
.online-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--success);
  display: inline-block;
  animation: pulse 2s infinite;
}
@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.4 } }

/* --- \u4E3B\u5185\u5BB9\u533A --- */
.main {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.panel-messages {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  background: var(--bg);
}

/* --- \u6D88\u606F\u5217\u8868 --- */
.msg-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg-list:empty::after {
  content: "\u7B49\u5F85\u6D88\u606F\u2026";
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--text-muted);
  font-size: 14px;
  align-self: center;
}

/* \u623F\u95F4\u4FE1\u606F\u6A2A\u5E45 */
.room-banner {
  align-self: center;
  text-align: center;
  padding: 4px 16px;
  margin: 0 0 8px;
  font-size: 11px;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
}
.room-banner strong { color: var(--text-secondary); }

/* \u6D88\u606F\u5361\u7247 - \u8FDC\u7AEF\uFF08\u5DE6\u4FA7\uFF09 */
.msg-card {
  background: var(--bubble-other);
  border-radius: 6px 18px 18px 18px;
  padding: 10px 14px;
  cursor: pointer;
  transition: all var(--transition);
  animation: fadeIn .25s ease;
  word-break: break-word;
  overflow-wrap: break-word;
  font-size: 14px;
  line-height: 1.55;
  width: fit-content;
  max-width: 85%;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans SC", sans-serif;
  box-shadow: none;
  align-self: flex-start;
  position: relative;
}
.msg-card .msg-content { white-space: pre-wrap; }
.msg-card:hover { filter: brightness(.97); }
.msg-card.selected { filter: brightness(.93); box-shadow: 0 0 0 2px var(--accent-light); }
.msg-card.new-msg { animation: highlightIn .6s ease; }

.msg-card.local {
  align-self: flex-end;
  background: var(--bubble-self);
  color: var(--bubble-self-text);
  border: none;
  border-radius: 18px 6px 18px 18px;
}
.msg-card.local:hover { filter: brightness(.97); }
[data-theme=\\"dark\\"] .msg-card.local { background: var(--bubble-self); color: var(--bubble-self-text); }
[data-theme=\\"dark\\"] .msg-card.local:hover { filter: brightness(1.08); }

.msg-card.history-msg {
  background: #dce6f5;
  padding: 8px 14px;
  opacity: 1;
  box-shadow: none;
  border-radius: 6px 14px 14px 14px;
}
.msg-card.history-msg .msg-content {
  color: #1a3a7a;
  font-weight: 500;
}
[data-theme="dark"] .msg-card.history-msg {
  background: #1a2538;
}
[data-theme="dark"] .msg-card.history-msg .msg-content {
  color: #8aaff5;
}
.msg-card.history-msg.local {
  background: #c8e6d0;
  border-radius: 14px 6px 14px 14px;
}
.msg-card.history-msg.local .msg-content { color: #1a3a7a; }
[data-theme="dark"] .msg-card.history-msg.local {
  background: #1a2e24;
}
[data-theme="dark"] .msg-card.history-msg.local .msg-content { color: #8aaff5; }
.msg-card.history-msg .msg-meta { margin-top: 2px; font-size: 10px; }

.msg-card.image-card {
  padding: 3px;
  cursor: pointer;
  width: auto;
  max-width: 300px;
  border-radius: 16px;
  overflow: hidden;
}
.msg-card.image-card.local { border-radius: 16px; }
.msg-card.image-card.history-msg { max-width: 170px; }
.msg-card.image-card.history-msg .msg-image { max-height: 110px; }
.msg-card .msg-image {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 9px;
  display: block;
  cursor: zoom-in;
}
.msg-meta {
  display: none;
  font-size: 10px;
  color: var(--text-secondary);
  margin-top: 3px;
  gap: 6px;
  user-select: none;
}
.msg-card:hover .msg-meta {
  display: flex;
  justify-content: flex-start;
}
.msg-card.local:hover .msg-meta {
  justify-content: flex-end;
}
.image-card .msg-meta { padding: 0 6px 4px; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes highlightIn {
  0% { filter: brightness(.92); transform: scale(1.01); }
  100% { filter: brightness(1); transform: scale(1); }
}

/* --- \u5386\u53F2\u6298\u53E0 --- */
.history-fold {
  width: 100%;
  text-align: center;
  padding: 4px 0;
  align-self: center;
}
.history-fold-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 11px;
  padding: 5px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-family: inherit;
  transition: all var(--transition);
}
.history-fold-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }
.history-section {
  display: none;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
}
.history-section.show { display: flex; }
.history-sep {
  width: 100%;
  border: none;
  border-top: 1px solid var(--border);
  margin: 10px 0 6px;
  align-self: center;
}

/* --- \u4E3B\u9898\u5207\u6362 --- */
.theme-btn {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  width: 32px; height: 32px;
  cursor: pointer;
  font-size: 15px;
  display: flex; align-items: center; justify-content: center;
  transition: all var(--transition);
  flex-shrink: 0;
}
.theme-btn:hover { border-color: var(--accent); background: var(--accent-light); transform: scale(1.05); }

.btn {
  padding: 9px 18px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: inherit;
  display: flex; align-items: center; gap: 6px;
  letter-spacing: .2px;
}
.btn:active { transform: scale(.97); }
.btn-primary {
  background: var(--accent-gradient);
  color: #fff;
  box-shadow: 0 2px 8px rgba(79,110,246,.3);
}
.btn-primary:hover { box-shadow: 0 4px 14px rgba(79,110,246,.4); transform: translateY(-1px); }
.btn-secondary {
  background: var(--bg);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-secondary:hover { background: var(--surface-hover); border-color: var(--accent); color: var(--accent); }
.btn-icon {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  width: 42px; height: 42px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 18px;
  transition: all var(--transition);
  flex-shrink: 0;
}
.btn-icon:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-light); }

/* --- \u5E95\u90E8\u8F93\u5165\u533A --- */
.input-bar {
  background: var(--surface);
  border-top: 1px solid var(--border);
  padding: 10px 14px;
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-shrink: 0;
}
.msg-textarea {
  flex: 1;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 14px;
  font-size: 13px;
  font-family: "SF Mono", "Fira Code", "Cascadia Code", Consolas, "Noto Sans SC", monospace;
  tab-size: 4;
  outline: none;
  transition: all var(--transition);
  background: var(--bg);
  color: var(--text);
  resize: none;
  line-height: 1.5;
  min-height: 42px;
  max-height: 200px;
  overflow-y: auto;
}
.msg-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
  background: var(--surface);
}
.drop-zone {
  position: fixed; inset: 0; z-index: 300;
  display: none; align-items: center; justify-content: center;
  background: rgba(79,110,246,.06);
  backdrop-filter: blur(4px);
  border: 3px dashed var(--accent); margin: 24px; border-radius: 24px;
  pointer-events: none;
}
.drop-zone.active { display: flex; }
.drop-zone span { font-size: 22px; color: var(--accent); font-weight: 700; }

/* --- \u52A0\u5165\u9875\u9762 --- */
.join-overlay {
  position: fixed; inset: 0;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.join-overlay::before {
  content: '';
  position: absolute;
  top: -120px; right: -120px;
  width: 400px; height: 400px;
  background: radial-gradient(circle, var(--accent-light) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.join-overlay::after {
  content: '';
  position: absolute;
  bottom: -80px; left: -80px;
  width: 300px; height: 300px;
  background: radial-gradient(circle, rgba(123,92,240,.08) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}
.join-card {
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 36px 32px;
  width: 400px;
  max-width: 92vw;
  text-align: center;
  position: relative;
  z-index: 1;
  border: 1px solid var(--border);
}
.join-card h1 {
  font-size: 30px;
  font-weight: 800;
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}
.join-card .subtitle { color: var(--text-muted); font-size: 14px; margin-bottom: 28px; }
.join-card label { display: block; text-align: left; font-size: 12px; font-weight: 600; margin-bottom: 5px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .5px; }
.join-card input, .join-card select {
  width: 100%; padding: 11px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
  font-size: 14px; font-family: inherit; outline: none; margin-bottom: 16px; transition: all var(--transition);
  background: var(--bg); color: var(--text);
}
.join-card input:focus, .join-card select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}
.join-card .btn { width: 100%; justify-content: center; padding: 13px; font-size: 15px; border-radius: var(--radius); }

/* --- Toast --- */
.toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%);
  background: var(--text); color: var(--bg); padding: 10px 22px; border-radius: var(--radius);
  font-size: 13px; z-index: 200; animation: toastIn .3s ease;
  pointer-events: none; font-weight: 500;
  box-shadow: var(--shadow-lg);
}
.toast.fadeout { animation: toastOut .25s ease forwards; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
@keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }

/* --- \u56FE\u7247\u706F\u7BB1 --- */
.lightbox {
  position: fixed; inset: 0; background: rgba(0,0,0,.9); z-index: 400;
  display: none; align-items: center; justify-content: center; cursor: pointer;
  backdrop-filter: blur(8px);
  animation: fadeIn .2s ease;
}
.lightbox.show { display: flex; }
.lightbox img { max-width: 92vw; max-height: 92vh; border-radius: var(--radius); box-shadow: 0 12px 48px rgba(0,0,0,.5); }

/* --- \u54CD\u5E94\u5F0F --- */
@media (max-width: 768px) {
  .main { flex-direction: column; }
  .header { padding: 8px 14px; gap: 8px; }
  .room-token { max-width: 80px; font-size: 10px; }
  .msg-card { max-width: 85%; font-size: 14px; }
  .msg-card.image-card { max-width: 240px; }
  .msg-textarea { font-size: 15px; }
  .header-right .online-count { display: none; }
  .header-right .status-badge { display: none; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .msg-card { max-width: 70%; }
}
@media (min-width: 1025px) {
  .msg-card { max-width: 60%; }
}
</style>
</head>
<body>

<!-- \u56FE\u7247\u706F\u7BB1 -->
<div class="lightbox" id="lightbox"><img id="lightboxImg" alt=""></div>

<!-- \u62D6\u653E\u533A\u57DF -->
<div class="drop-zone" id="dropZone"><span>\u91CA\u653E\u4EE5\u53D1\u9001\u56FE\u7247</span></div>

<!-- \u52A0\u5165\u623F\u95F4\u8986\u76D6\u5C42 -->
<div class="join-overlay" id="joinOverlay" style="display:none">
  <div class="join-card">
    <h1>ClipRelay</h1>
    <p class="subtitle">\u8DE8\u8BBE\u5907\u6587\u672C\u63A5\u529B \xB7 30\u5206\u949F\u4E34\u65F6\u623F\u95F4</p>
    <label for="tokenInput">\u623F\u95F4\u4EE4\u724C</label>
    <input type="text" id="tokenInput" placeholder="\u8F93\u5165\u623F\u95F4\u4EE4\u724C\u6216\u7C98\u8D34\u94FE\u63A5\u2026" autocomplete="off">
    <label for="deviceSelect">\u8BBE\u5907\u7C7B\u578B</label>
    <select id="deviceSelect">
      <option value="desktop">\u684C\u9762\u7AEF</option>
      <option value="mobile">\u624B\u673A\u7AEF</option>
      <option value="tablet">\u5E73\u677F\u7AEF</option>
    </select>
    <button class="btn btn-primary" id="joinBtn">\u8FDB\u5165\u623F\u95F4</button>
  </div>
</div>

<!-- \u4E3B\u754C\u9762 -->
<div class="header" id="header" style="display:none">
  <div class="header-left">
    <span class="logo">ClipRelay</span>
    <span class="room-token" id="roomTokenDisplay" title="\u623F\u95F4\u4EE4\u724C"></span>
  </div>
  <div class="header-right">
    <button class="btn btn-secondary btn-sm" id="clearBtn2" style="display:none" title="\u6E05\u7A7A\u6D88\u606F">\u6E05\u7A7A</button>
    <span class="online-count"><span class="online-dot"></span><span id="onlineCount">0</span> \u5728\u7EBF</span>
    <span class="status-badge active" id="statusBadge">\u6D3B\u8DC3</span>
    <button class="theme-btn" id="themeBtn" title="\u5207\u6362\u4E3B\u9898">\u{1F319}</button>
  </div>
</div>

<div class="main" id="main" style="display:none">
  <div class="panel-messages">
    <div class="msg-list" id="msgList">
      <div class="room-banner" id="roomBanner" style="display:none"></div>
      <div class="history-fold" id="historyFold"></div>
      <div class="history-section" id="historySection"></div>
    </div>
    <div class="input-bar">
      <textarea class="msg-textarea" id="msgInput" placeholder="\u8F93\u5165\u6D88\u606F" rows="1" autocomplete="off"></textarea>
      <button class="btn-icon" id="imgBtn" title="\u53D1\u9001\u56FE\u7247">\u{1F5BC}</button>
      <input type="file" id="imgInput" accept="image/*" style="display:none">
      <a href="https://upfile.live/zh-cn/" target="_blank" rel="noopener" class="btn-icon" id="fileBtn" title="\u6587\u4EF6\u4F20\u9001\uFF08\u7B2C\u4E09\u65B9\uFF09">\u{1F4CE}</a>
      <button class="btn btn-primary" id="sendBtn">\u53D1\u9001</button>
    </div>
  </div>

  </div>

<script>
(function() {
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const joinOverlay = $('#joinOverlay');
  const tokenInput = $('#tokenInput');
  const deviceSelect = $('#deviceSelect');
  const joinBtn = $('#joinBtn');
  const header = $('#header');
  const main = $('#main');
  const roomTokenDisplay = $('#roomTokenDisplay');
  const onlineCountEl = $('#onlineCount');
  const statusBadge = $('#statusBadge');
  const msgList = $('#msgList');
  const historyFold = $('#historyFold');
  const historySection = $('#historySection');
  const roomBanner = $('#roomBanner');
  const msgInput = $('#msgInput');
  const sendBtn = $('#sendBtn');
  const imgBtn = $('#imgBtn');
  const imgInput = $('#imgInput');
  const themeBtn = $('#themeBtn');
  const clearBtn2 = $('#clearBtn2');
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightboxImg');
  const dropZone = $('#dropZone');

  // --- \u72B6\u6001 ---
  let ws = null;
  let token = '';
  let deviceType = 'desktop';
  let selectedMsgId = null;
  let defaultToken = '';

  // --- \u8BBE\u5907\u68C0\u6D4B ---
  function detectDevice() {
    const ua = navigator.userAgent;
    const isMobile = /Mobi|Android|iPhone/i.test(ua);
    const isTablet = /iPad|Tablet|PlayBook/i.test(ua) || (isMobile && window.innerWidth >= 768);
    if (isTablet) return 'tablet';
    if (isMobile) return 'mobile';
    return 'desktop';
  }

  // --- Toast ---
  function showToast(text) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('fadeout'); setTimeout(() => el.remove(), 300); }, 2000);
  }

  // --- \u526A\u8D34\u677F ---
  async function copyToClipboard(text) {
    // \u65B9\u68481: Clipboard API\uFF08\u65E0\u9700\u7528\u6237\u624B\u52BF\uFF0C\u81EA\u52A8\u590D\u5236/\u70B9\u51FB\u90FD\u53EF\u7528\uFF09
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) {}
    }
    // \u65B9\u68482: execCommand\uFF08\u540C\u6B65\uFF0C\u9700\u8981\u9875\u9762\u7126\u70B9\uFF09
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:2px;height:2px;opacity:0;pointer-events:none;z-index:-1;';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, 999999);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    return ok;
  }


  // --- WebSocket ---
  function connect() {
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = \`\${protocol}//\${location.host}/?token=\${encodeURIComponent(token)}\`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'join', device_type: deviceType }));
    };

    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      handleMessage(data);
    };

    ws.onclose = (event) => {
      if (event.code === 4001) {
        handleExpired();
      } else if (event.code !== 4003) {
        setTimeout(() => { if (!ws || ws.readyState > 1) connect(); }, 3000);
      }
    };

    ws.onerror = () => {};
  }

  // --- \u684C\u9762\u901A\u77E5 ---
  function requestNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  // \u515C\u5E95\uFF1A\u9996\u6B21\u7528\u6237\u4EA4\u4E92\u65F6\u8BF7\u6C42\u901A\u77E5\u6743\u9650\uFF08\u9002\u7528\u4E8E URL \u76F4\u8FDE\u8DF3\u8FC7\u52A0\u5165\u9875\u7684\u60C5\u51B5\uFF09
  function installDelayedPermissionRequest() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    const handler = () => {
      Notification.requestPermission();
      document.removeEventListener('click', handler);
      document.removeEventListener('keydown', handler);
    };
    document.addEventListener('click', handler);
    document.addEventListener('keydown', handler);
  }

  function showDesktopNotification(msg) {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    // \u53EA\u5728\u9875\u9762\u4E0D\u53EF\u89C1\u65F6\u5F39\u901A\u77E5
    if (!document.hidden) return;

    const isImage = msg.msg_type === 'image';
    const title = 'ClipRelay \xB7 \u65B0\u6D88\u606F';
    const body = isImage ? '[\u56FE\u7247]' : (msg.content.length > 120 ? msg.content.slice(0, 120) + '\u2026' : msg.content);
    const n = new Notification(title, {
      body,
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f6ef6"/><text x="50" y="68" font-size="50" text-anchor="middle" fill="white">\u{1F4CB}</text></svg>',
      tag: 'clip-relay-msg',
      renotify: true,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
    setTimeout(() => n.close(), 5000);
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'joined': {
        // \u6E05\u7A7A\u5217\u8868\u548C\u6298\u53E0\u533A
        msgList.querySelectorAll('.msg-card').forEach(c => c.remove());
        historySection.innerHTML = '';
        historyFold.innerHTML = '';

        // \u663E\u793A\u623F\u95F4\u4FE1\u606F\u6A2A\u5E45
        if (data.room_name) {
          roomBanner.innerHTML = '<strong>' + escapeHtml(data.room_name) + '</strong>';
        } else {
          roomBanner.innerHTML = '\u623F\u95F4';
        }
        roomBanner.style.display = '';

        if (data.messages.length > 0) {
          // \u5386\u53F2\u6D88\u606F\u653E\u5165\u6298\u53E0\u533A
          for (const m of data.messages) {
            appendMessageCard(m, false, historySection);
          }
          // \u663E\u793A\u6298\u53E0\u6309\u94AE
          historyFold.innerHTML = \`<hr class="history-sep"><button class="history-fold-btn" id="historyToggle">\u5C55\u5F00\u5386\u53F2\u6D88\u606F (\${data.messages.length}\u6761)</button>\`;
          const toggleBtn = historyFold.querySelector('#historyToggle');
          toggleBtn.addEventListener('click', () => {
            const show = historySection.classList.toggle('show');
            toggleBtn.textContent = show
              ? \`\u6536\u8D77\u5386\u53F2\u6D88\u606F (\${data.messages.length}\u6761)\`
              : \`\u5C55\u5F00\u5386\u53F2\u6D88\u606F (\${data.messages.length}\u6761)\`;
          });
        }
        scrollToBottom();
        updateRoomStatus(data.expires_in, data.online_count);
        if (data.permanent) {
          statusBadge.textContent = '\u6C38\u4E45';
          statusBadge.className = 'status-badge active';
        } else {
          startCountdown(data.expires_in);
        }
        // \u663E\u793A\u6E05\u7A7A\u6309\u94AE
        clearBtn2.style.display = '';
        break;
      }

      case 'message':
      case 'image': {
        const m = data.message;
        appendMessageCard(m, true);
        selectedMsgId = m.id;
        highlightSelectedCard();
        showDesktopNotification(m);
        break;
      }

      case 'device_joined': {
        showToast(\`\${deviceLabel(data.device_type)} \u52A0\u5165\u4E86\u623F\u95F4\`);
        break;
      }

      case 'device_left': {
        showToast(\`\${deviceLabel(data.device_type)} \u79BB\u5F00\u4E86\u623F\u95F4\`);
        break;
      }

      case 'room_expired': {
        handleExpired();
        break;
      }

      case 'messages_cleared': {
        msgList.querySelectorAll('.msg-card').forEach(c => c.remove());
        historySection.innerHTML = '';
        historyFold.innerHTML = '';
        roomBanner.style.display = '';
        showToast('\u6D88\u606F\u5DF2\u6E05\u7A7A');
        break;
      }

      case 'error': {
        showToast(\`\u9519\u8BEF: \${data.message}\`);
        break;
      }
    }
  }

function appendMessageCard(msg, isNew, container) {
    const target = container || msgList;
    const isHistory = target === historySection;
    const card = document.createElement('div');
    const isImage = msg.msg_type === 'image';
    card.className = 'msg-card'
      + (isNew ? ' new-msg' : '')
      + (isHistory ? ' history-msg' : '')
      + (isImage ? ' image-card' : '');
    card.dataset.msgId = msg.id;
    card.dataset.msgType = msg.msg_type || 'text';

    if (isImage) {
      card.innerHTML = \`
        <img class="msg-image" src="\${escapeAttr(msg.content)}" alt="\u56FE\u7247" loading="lazy">
        <div class="msg-meta">
          <span>\${formatTime(msg.created_at)}</span>
          <span>\u56FE\u7247 #\${msg.id}</span>
        </div>\`;
      card.querySelector('.msg-image').addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.src = msg.content;
        lightbox.classList.add('show');
      });
    } else {
      card.innerHTML = \`
        <div class="msg-content">\${escapeHtml(msg.content)}</div>
        <div class="msg-meta">
          <span>\${formatTime(msg.created_at)}</span>
          <span>#\${msg.id}</span>
        </div>\`;
    }

    let _touched = false;

    card.addEventListener('touchend', () => {
      const sel = window.getSelection().toString().trim();
      if (sel && msg.msg_type !== 'image') {
        _touched = true;
        setTimeout(() => { copyToClipboard(sel); showToast('\u5DF2\u590D\u5236'); }, 10);
      }
    });

    card.addEventListener('click', () => {
      if (msg.msg_type === 'image' || _touched) { _touched = false; return; }
      const sel = window.getSelection().toString().trim();
      copyToClipboard(sel || msg.content);
      showToast('\u5DF2\u590D\u5236');
    });

    target.appendChild(card);

    if (isNew) {
      scrollToBottom();
    }
  }

  function highlightSelectedCard() {
    $$('.msg-card').forEach(c => c.classList.remove('selected'));
    const card = document.querySelector(\`.msg-card[data-msg-id="\${selectedMsgId}"]\`);
    if (card) card.classList.add('selected');
  }

  function scrollToBottom() {
    msgList.scrollTop = msgList.scrollHeight;
  }

  function updateRoomStatus(expiresIn, onlineCount) {
    onlineCountEl.textContent = onlineCount;

    if (expiresIn === -1) {
      // \u6C38\u4E45\u623F\u95F4\uFF0C\u4E0D\u66F4\u65B0\uFF08\u7531 joined \u5904\u7406\uFF09
      return;
    }
    if (expiresIn <= 0) {
      statusBadge.textContent = '\u5DF2\u8FC7\u671F';
      statusBadge.className = 'status-badge expired';
    } else if (expiresIn < 300) {
      statusBadge.textContent = formatDuration(expiresIn);
      statusBadge.className = 'status-badge expiring';
    } else {
      statusBadge.textContent = formatDuration(expiresIn);
      statusBadge.className = 'status-badge active';
    }
  }

  function handleExpired() {
    statusBadge.textContent = '\u5DF2\u8FC7\u671F';
    statusBadge.className = 'status-badge expired';
    showToast('\u623F\u95F4\u5DF2\u8FC7\u671F\uFF0830\u5206\u949F\uFF09');
    msgInput.disabled = true;
    sendBtn.disabled = true;
    imgBtn.disabled = true;
    if (ws) ws.close();
  }

  // --- \u53D1\u9001\u6D88\u606F ---
  function sendMessage() {
    const content = msgInput.value.trim();
    if (!content) return;
    if (!ws || ws.readyState !== 1) {
      showToast('\u672A\u8FDE\u63A5\u5230\u623F\u95F4');
      return;
    }
    ws.send(JSON.stringify({ type: 'message', content }));
    appendLocalMessage(content, 'text');
    msgInput.value = '';
    msgInput.style.height = '';
    msgInput.focus();
  }

  function sendImage(dataUrl, filename) {
    if (!ws || ws.readyState !== 1) {
      showToast('\u672A\u8FDE\u63A5\u5230\u623F\u95F4');
      return;
    }
    ws.send(JSON.stringify({ type: 'image', content: dataUrl, filename: filename || 'image.png' }));
    appendLocalMessage(dataUrl, 'image', filename);
  }

  function appendLocalMessage(content, msgType, filename) {
    const card = document.createElement('div');
    const isImage = msgType === 'image';
    card.className = 'msg-card local' + (isImage ? ' image-card' : '');
    card.dataset.local = 'true';
    card.dataset.msgType = msgType;
    const now = new Date().toISOString();

    if (isImage) {
      card.innerHTML = \`
        <img class="msg-image" src="\${escapeAttr(content)}" alt="\u56FE\u7247" loading="lazy">
        <div class="msg-meta">
          <span>\${formatTime(now)}</span>
          <span>\u672C\u5730\u56FE\u7247</span>
        </div>\`;
      card.querySelector('.msg-image').addEventListener('click', (e) => {
        e.stopPropagation();
        lightboxImg.src = content;
        lightbox.classList.add('show');
      });
    } else {
      card.innerHTML = \`
        <div class="msg-content">\${escapeHtml(content)}</div>
        <div class="msg-meta">
          <span>\${formatTime(now)}</span>
          <span>\u672C\u5730</span>
        </div>\`;
    }

    let _touched = false;

    card.addEventListener('touchend', () => {
      const sel = window.getSelection().toString().trim();
      if (sel && msgType !== 'image') {
        _touched = true;
        setTimeout(() => { copyToClipboard(sel); showToast('\u5DF2\u590D\u5236'); }, 10);
      }
    });

    card.addEventListener('click', () => {
      if (msgType === 'image' || _touched) { _touched = false; return; }
      const sel = window.getSelection().toString().trim();
      copyToClipboard(sel || content);
      showToast('\u5DF2\u590D\u5236');
    });
    msgList.appendChild(card);
    scrollToBottom();
  }

  // --- \u56FE\u7247\u5904\u7406 ---
  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      showToast('\u4EC5\u652F\u6301\u56FE\u7247\u6587\u4EF6');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      sendImage(reader.result, file.name);
    };
    reader.readAsDataURL(file);
  }

  // --- \u5012\u8BA1\u65F6 ---
  let countdownInterval = null;
  function startCountdown(initialSeconds) {
    let remaining = initialSeconds;
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        updateRoomStatus(0, parseInt(onlineCountEl.textContent) || 0);
        handleExpired();
      } else {
        updateRoomStatus(remaining, parseInt(onlineCountEl.textContent) || 0);
      }
    }, 1000);
  }

  // --- \u5DE5\u5177\u51FD\u6570 ---
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatTime(iso) {
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, '0');
    return \`\${pad(d.getHours())}:\${pad(d.getMinutes())}:\${pad(d.getSeconds())}\`;
  }

  function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return \`\${m}\u5206\${s}\u79D2\`;
  }

  function deviceLabel(type) {
    return { mobile: '\u624B\u673A', tablet: '\u5E73\u677F', desktop: '\u684C\u9762' }[type] || type;
  }

  // --- \u4E8B\u4EF6\u7ED1\u5B9A ---
  joinBtn.addEventListener('click', () => {
    const input = tokenInput.value.trim() || defaultToken || 'clip-relay';
    token = input;
    deviceType = deviceSelect.value;
    roomTokenDisplay.textContent = token;
    joinOverlay.style.display = 'none';
    header.style.display = '';
    main.style.display = '';
    requestNotificationPermission();
    connect();
  });

  tokenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  // \u8F93\u5165\u6846\u81EA\u9002\u5E94\u9AD8\u5EA6
  msgInput.addEventListener('input', () => {
    msgInput.style.height = '';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 200) + 'px';
  });

  // \u7C98\u8D34\u56FE\u7247
  msgInput.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        handleImageFile(item.getAsFile());
        return;
      }
    }
  });

  // \u56FE\u7247\u6309\u94AE
  imgBtn.addEventListener('click', () => imgInput.click());
  imgInput.addEventListener('change', () => {
    if (imgInput.files[0]) {
      handleImageFile(imgInput.files[0]);
      imgInput.value = '';
    }
  });

  // \u62D6\u653E\u56FE\u7247
  let dragCounter = 0;
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    if (dragCounter === 1) dropZone.classList.add('active');
  });
  document.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter === 0) dropZone.classList.remove('active');
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('active');
    const files = e.dataTransfer?.files;
    if (files && files[0]) handleImageFile(files[0]);
  });

  // \u706F\u7BB1\u5173\u95ED
  lightbox.addEventListener('click', () => lightbox.classList.remove('show'));

  // --- \u4E3B\u9898\u5207\u6362 ---
  function applyTheme(dark) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : '');
    themeBtn.textContent = dark ? '\u2600\uFE0F' : '\u{1F319}';
    try { localStorage.setItem('clip-relay-theme', dark ? 'dark' : 'light'); } catch (_) {}
  }

  clearBtn2.addEventListener('click', () => {
    if (!ws || ws.readyState !== 1) return;
    if (confirm('\u786E\u5B9A\u6E05\u7A7A\u5F53\u524D\u623F\u95F4\u6240\u6709\u6D88\u606F\uFF1F')) {
      ws.send(JSON.stringify({ type: 'clear_messages' }));
    }
  });

  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    applyTheme(!isDark);
  });

  // --- \u521D\u59CB\u5316 ---
  async function init() {
    deviceSelect.value = detectDevice();

    // \u540C\u6B65\u68C0\u67E5 URL token\uFF08\u4E0D\u7B49\u5F02\u6B65\u8BF7\u6C42\uFF09
    const params = new URLSearchParams(location.search);
    let urlToken = params.get('token');
    if (!urlToken && location.hash) {
      urlToken = location.hash.slice(1);
    }

    if (urlToken) {
      // \u6709 token \u2192 \u76F4\u63A5\u8FDB\u5165\u623F\u95F4
      token = urlToken;
      deviceType = deviceSelect.value;
      roomTokenDisplay.textContent = token;
      header.style.display = '';
      main.style.display = '';
      connect();
      return;
    }

    // \u65E0 token \u2192 \u83B7\u53D6\u914D\u7F6E\u540E\u663E\u793A\u52A0\u5165\u9875\u9762
    try {
      const resp = await fetch('/api/config');
      const cfg = await resp.json();
      if (cfg.defaultToken) defaultToken = cfg.defaultToken;
    } catch (_) {}

    tokenInput.value = defaultToken || '';
    joinOverlay.style.display = '';
  }

  init();
})();
<\/script>
</body>
</html>
`;
var ADMIN_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="dark light">
<title>\u623F\u95F4\u7BA1\u7406 \xB7 ClipRelay</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

:root{
  color-scheme:light;
  --bg:#f2f3f7;--surface:#fff;--border:#e4e7ed;--text:#1e1f24;
  --text-secondary:#868b96;--text-muted:#b0b5bf;
  --accent:#4f6ef6;--accent-hover:#3d5de0;--accent-light:#eef1fe;
  --accent-gradient:linear-gradient(135deg,#4f6ef6 0%,#7b5cf0 100%);
  --danger:#ef4444;--success:#10b981;--warning:#f59e0b;
  --radius:10px;--radius-sm:6px;
  --shadow:0 2px 8px rgba(0,0,0,.06);--shadow-lg:0 8px 24px rgba(0,0,0,.08);
  --transition:.2s cubic-bezier(.4,0,.2,1);
}
[data-theme="dark"]{
  color-scheme:dark;
  --bg:#0d0f14;--surface:#161820;--border:#282b35;--text:#e3e5ec;
  --text-secondary:#8d919e;--text-muted:#5e6270;
  --accent:#6b8af7;--accent-hover:#8ba4f9;--accent-light:#1a2040;
  --danger:#f87171;--success:#34d399;--warning:#fbbf24;
  --shadow:0 2px 8px rgba(0,0,0,.3);--shadow-lg:0 8px 24px rgba(0,0,0,.4);
}

body{
  font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Noto Sans SC",sans-serif;
  background:var(--bg);color:var(--text);min-height:100vh;
  -webkit-font-smoothing:antialiased;
}

.container{max-width:1000px;margin:0 auto;padding:24px 20px 120px}

.header{
  display:flex;align-items:center;justify-content:space-between;
  margin-bottom:28px;flex-wrap:wrap;gap:12px;
}
.header h1{
  font-size:24px;font-weight:800;
  background:var(--accent-gradient);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.header-actions{display:flex;gap:10px;align-items:center;}

.btn{
  padding:8px 18px;border:none;border-radius:var(--radius-sm);font-size:13px;
  font-weight:600;cursor:pointer;transition:all var(--transition);font-family:inherit;
}
.btn:active{transform:scale(.97)}
.btn-primary{background:var(--accent-gradient);color:#fff;box-shadow:0 2px 8px rgba(79,110,246,.25)}
.btn-primary:hover{box-shadow:0 4px 14px rgba(79,110,246,.35);transform:translateY(-1px)}
.btn-danger{background:var(--danger);color:#fff}
.btn-danger:hover{background:#dc2626}
.btn-secondary{background:var(--bg);color:var(--text-secondary);border:1px solid var(--border)}
.btn-secondary:hover{border-color:var(--accent);color:var(--accent)}
.btn-sm{padding:5px 12px;font-size:12px}

/* \u767B\u5F55\u9875 */
.login-overlay{
  position:fixed;inset:0;background:var(--bg);display:flex;
  align-items:center;justify-content:center;z-index:1000;
}
.login-card{
  background:var(--surface);border-radius:var(--radius);padding:36px 32px;
  width:360px;max-width:92vw;text-align:center;
  box-shadow:var(--shadow-lg);border:1px solid var(--border);
}
.login-card h1{
  font-size:26px;font-weight:800;margin-bottom:4px;
  background:var(--accent-gradient);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.login-card .sub{color:var(--text-muted);font-size:14px;margin-bottom:24px}
.login-card label{display:block;text-align:left;font-size:12px;font-weight:600;color:var(--text-secondary);margin-bottom:5px;text-transform:uppercase;letter-spacing:.3px}
.login-card input{
  width:100%;padding:11px 14px;border:1px solid var(--border);border-radius:var(--radius-sm);
  font-size:14px;font-family:inherit;outline:none;margin-bottom:16px;
  background:var(--bg);color:var(--text);transition:border-color var(--transition);
}
.login-card input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-light)}
.login-card .btn{width:100%;justify-content:center;padding:12px;font-size:15px;border-radius:var(--radius)}
.login-error{
  color:var(--danger);font-size:13px;margin-top:12px;
  background:#fef2f2;padding:10px 14px;border-radius:var(--radius-sm);
  border:1px solid #fecaca;display:none;
}
.login-error.show{display:block}
[data-theme="dark"] .login-error{background:#450a0a;border-color:#7f1d1d}

/* \u5BC6\u7801\u53EF\u89C1\u5207\u6362 */
.pwd-wrap{position:relative;margin-bottom:16px}
.pwd-wrap input{margin-bottom:0!important}
.pwd-toggle{
  position:absolute;right:12px;top:50%;transform:translateY(-50%);
  background:none;border:none;cursor:pointer;font-size:16px;color:var(--text-muted);
  padding:4px;font-family:inherit;line-height:1;
}
.pwd-toggle:hover{color:var(--text)}

/* \u4FEE\u6539\u5BC6\u7801\u5361\u7247 */
.pwd-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:20px 24px;margin-bottom:24px;
  box-shadow:var(--shadow);
}
.pwd-card h2{font-size:16px;margin-bottom:14px;color:var(--text-secondary)}
.pwd-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.pwd-group{display:flex;flex-direction:column;gap:5px}
.pwd-group label{font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px}
.pwd-group input{
  padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);
  font-size:14px;font-family:inherit;outline:none;width:180px;
  background:var(--bg);color:var(--text);transition:border-color var(--transition);
}
.pwd-group input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-light)}

/* \u521B\u5EFA\u8868\u5355 */
.create-card{
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);padding:20px 24px;margin-bottom:24px;
  box-shadow:var(--shadow);
}
.create-card h2{font-size:16px;margin-bottom:14px;color:var(--text-secondary)}
.form-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}
.form-group{display:flex;flex-direction:column;gap:5px}
.form-group label{font-size:12px;font-weight:600;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.3px}
.form-group input,.form-group select{
  padding:9px 12px;border:1px solid var(--border);border-radius:var(--radius-sm);
  font-size:14px;font-family:inherit;outline:none;background:var(--bg);color:var(--text);
  transition:border-color var(--transition);
}
.form-group input:focus,.form-group select:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-light)}
.form-group input{width:220px}
.form-group select{width:150px}

/* \u623F\u95F4\u5217\u8868 */
.room-table{
  width:100%;border-collapse:collapse;
  background:var(--surface);border-radius:var(--radius);
  overflow:hidden;box-shadow:var(--shadow);border:1px solid var(--border);
}
.room-table th,.room-table td{
  text-align:left;padding:12px 16px;font-size:13px;
  border-bottom:1px solid var(--border);
}
.room-table th{background:var(--bg);font-weight:600;color:var(--text-secondary);font-size:11px;text-transform:uppercase;letter-spacing:.3px}
.room-table tbody tr:hover{background:var(--accent-light)}
.room-table .token{font-family:"SF Mono","Fira Code",monospace;font-size:12px;color:var(--accent)}
.room-table .badge{
  display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;
}
.badge-permanent{background:#ecfdf5;color:#059669}
.badge-temp{background:#fffbeb;color:#d97706}
[data-theme="dark"] .badge-permanent{background:#064e3b;color:#34d399}
[data-theme="dark"] .badge-temp{background:#451a03;color:#fbbf24}
.room-table .actions{display:flex;gap:6px}
.room-table .row-disabled{opacity:.5;background:var(--bg)!important}
.room-table .row-disabled:hover{opacity:.7}
.btn-success{background:var(--success);color:#fff}
.btn-success:hover{background:#059669}

/* \u590D\u5236\u94FE\u63A5\u5F39\u7A97 */
.copy-popover{
  position:fixed;z-index:999;background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius);box-shadow:var(--shadow-lg);padding:8px 0;min-width:220px;
  animation:fadeIn .15s ease;
}
.copy-popover button{
  display:block;width:100%;padding:10px 16px;border:none;background:none;
  text-align:left;font-size:13px;font-family:inherit;cursor:pointer;color:var(--text);
  transition:background var(--transition);
}
.copy-popover button:hover{background:var(--accent-light);color:var(--accent)}
.copy-popover button small{display:block;font-size:11px;color:var(--text-muted);margin-top:1px}
.copy-popover .divider{border-top:1px solid var(--border);margin:4px 0}
@keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}

/* \u57DF\u540D\u72B6\u6001 */
.domain-status{
  display:inline-flex;align-items:center;gap:4px;font-size:12px;padding:2px 8px;
  border-radius:20px;font-weight:500;
}
.domain-status.set{background:#ecfdf5;color:#059669}
.domain-status.unset{background:var(--bg);color:var(--text-muted)}
[data-theme="dark"] .domain-status.set{background:#064e3b;color:#34d399}

.toast{
  position:fixed;bottom:24px;left:50%;transform:translateX(-50%);
  background:var(--text);color:var(--bg);padding:8px 18px;border-radius:var(--radius);
  font-size:13px;font-weight:500;z-index:100;box-shadow:var(--shadow-lg);
}

@media(max-width:700px){
  .form-row,.pwd-row{flex-direction:column}
  .form-group input,.form-group select,.pwd-group input{width:100%}
  .room-table{font-size:11px}
  .room-table th,.room-table td{padding:8px 10px}
}
</style>
</head>
<body>

<!-- \u767B\u5F55\u9875 -->
<div class="login-overlay" id="loginOverlay">
  <div class="login-card">
    <h1>ClipRelay</h1>
    <p class="sub">\u7BA1\u7406\u540E\u53F0 \xB7 \u8BF7\u8F93\u5165\u5BC6\u7801</p>
    <label for="loginPwd">\u5BC6\u7801</label>
    <div class="pwd-wrap">
      <input type="password" id="loginPwd" placeholder="\u9ED8\u8BA4\u5BC6\u7801 admin" autocomplete="current-password" style="padding-right:40px">
      <button type="button" class="pwd-toggle" id="pwdToggle" title="\u663E\u793A\u5BC6\u7801">\u{1F441}</button>
    </div>
    <button class="btn btn-primary" id="loginBtn">\u767B\u5F55</button>
    <p class="login-error" id="loginError"></p>
    <p style="font-size:12px;color:var(--accent);margin-top:16px;cursor:pointer;text-decoration:underline" id="forgotPwd" onclick="this.style.display='none';document.getElementById('recoveryHint').style.display='block'">\u5FD8\u8BB0\u5BC6\u7801\uFF1F</p>
    <p id="recoveryHint" style="display:none;font-size:12px;color:var(--text-secondary);margin-top:8px;background:var(--bg);padding:12px 14px;border-radius:6px;text-align:left;line-height:1.7">\u5FD8\u8BB0\u5BC6\u7801\u540E\uFF0C\u4F7F\u7528<strong>\u6062\u590D\u7801</strong>\u4F5C\u4E3A\u5BC6\u7801\u767B\u5F55\u5373\u53EF\u81EA\u52A8\u91CD\u7F6E\u5BC6\u7801\u3002<br><br>\xB7 \u767B\u5F55\u540E\u53F0 \u2192 \u6062\u590D\u7801\u5361\u7247 \u2192 \u67E5\u770B\u6062\u590D\u7801<br>\xB7 \u6BCF\u4E2A\u6062\u590D\u7801\u4EC5\u53EF\u4F7F\u7528\u4E00\u6B21<br>\xB7 \u6062\u590D\u7801\u7528\u5B8C\u540E\u53EF\u91CD\u65B0\u751F\u6210</p>
  </div>
</div>

<!-- \u4E3B\u754C\u9762 -->
<div class="container" id="mainPanel" style="display:none">

<div class="header">
  <h1>ClipRelay \u7BA1\u7406\u540E\u53F0</h1>
  <div class="header-actions">
    <a href="/" class="btn btn-secondary" style="text-decoration:none">\u2190 \u8FD4\u56DE\u9996\u9875</a>
    <button class="btn btn-secondary btn-sm" id="logoutBtn">\u9000\u51FA</button>
    <button class="btn btn-secondary btn-sm" id="themeBtn" title="\u5207\u6362\u4E3B\u9898">\u{1F319}</button>
  </div>
</div>

<!-- \u57DF\u540D\u8BBE\u7F6E -->
<div class="pwd-card">
  <h2>\u57DF\u540D\u8BBE\u7F6E <span class="domain-status unset" id="domainStatus">\u672A\u914D\u7F6E</span></h2>
  <div class="pwd-row">
    <div class="pwd-group">
      <label>\u516C\u7F51\u57DF\u540D\uFF08\u7528\u4E8E\u751F\u6210\u5916\u7F51\u94FE\u63A5\uFF09</label>
      <input type="text" id="domainInput" placeholder="\u4F8B\u5982\uFF1Arelay.yourdomain.com" autocomplete="off" style="width:300px">
    </div>
    <button class="btn btn-primary btn-sm" id="saveDomainBtn">\u4FDD\u5B58\u57DF\u540D</button>
  </div>
</div>

<!-- \u4FEE\u6539\u5BC6\u7801 -->
<div class="pwd-card">
  <h2>\u4FEE\u6539\u5BC6\u7801</h2>
  <div class="pwd-row">
    <div class="pwd-group">
      <label>\u539F\u5BC6\u7801</label>
      <input type="password" id="oldPwd" placeholder="\u8F93\u5165\u539F\u5BC6\u7801" autocomplete="off">
    </div>
    <div class="pwd-group">
      <label>\u65B0\u5BC6\u7801</label>
      <input type="password" id="newPwd" placeholder="\u8F93\u5165\u65B0\u5BC6\u7801" autocomplete="off">
    </div>
    <button class="btn btn-secondary" id="changePwdBtn">\u4FEE\u6539\u5BC6\u7801</button>
  </div>
</div>

<!-- \u6062\u590D\u7801 -->
<div class="pwd-card">
  <h2>\u6062\u590D\u7801 <span class="badge badge-permanent" id="rcCount" style="font-size:11px;vertical-align:middle;margin-left:6px">5 \u4E2A\u53EF\u7528</span></h2>
  <p style="font-size:12px;color:var(--text-secondary);margin:8px 0">\u6062\u590D\u7801\u53EF\u4E00\u6B21\u6027\u66FF\u4EE3\u7BA1\u7406\u5458\u5BC6\u7801\u767B\u5F55\uFF0C\u7528\u5B8C\u5373\u4F5C\u5E9F\u3002</p>
  <div id="rcList" style="font-family:monospace;font-size:13px;line-height:1.8;margin-bottom:10px;display:none"></div>
  <button class="btn btn-secondary btn-sm" id="showRcBtn">\u67E5\u770B\u6062\u590D\u7801</button>
  <button class="btn btn-secondary btn-sm" id="regenerateRcBtn" style="margin-left:8px">\u91CD\u65B0\u751F\u6210</button>
</div>

<!-- \u521B\u5EFA\u623F\u95F4 -->
<div class="create-card">
  <h2>\u521B\u5EFA\u65B0\u623F\u95F4</h2>
  <div class="form-row">
    <div class="form-group">
      <label>\u623F\u95F4\u540D\u79F0</label>
      <input type="text" id="roomName" placeholder="\u4F8B\u5982\uFF1A\u6211\u7684\u5DE5\u4F5C\u533A" autocomplete="off">
    </div>
    <div class="form-group">
      <label>\u81EA\u5B9A\u4E49\u4EE4\u724C\uFF08\u53EF\u9009\uFF09</label>
      <input type="text" id="roomToken" placeholder="\u7559\u7A7A\u81EA\u52A8\u751F\u6210" autocomplete="off">
    </div>
    <div class="form-group">
      <label>\u6709\u6548\u671F</label>
      <select id="roomTTL">
        <option value="30">30 \u5206\u949F\uFF08\u4E34\u65F6\uFF09</option>
        <option value="60">1 \u5C0F\u65F6</option>
        <option value="120">2 \u5C0F\u65F6</option>
        <option value="1440">24 \u5C0F\u65F6</option>
        <option value="0">\u6C38\u4E45\u6709\u6548</option>
      </select>
    </div>
    <button class="btn btn-primary" id="createBtn">\u521B\u5EFA\u623F\u95F4</button>
  </div>
</div>

<!-- \u623F\u95F4\u5217\u8868 -->
<table class="room-table">
  <thead>
    <tr>
      <th>\u623F\u95F4\u540D\u79F0</th>
      <th>\u4EE4\u724C</th>
      <th>\u6709\u6548\u671F</th>
      <th>\u6D88\u606F\u6570</th>
      <th>\u5728\u7EBF</th>
      <th>\u521B\u5EFA\u65F6\u95F4</th>
      <th>\u8FC7\u671F\u65F6\u95F4</th>
      <th>\u64CD\u4F5C</th>
    </tr>
  </thead>
  <tbody id="roomList"><tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">\u52A0\u8F7D\u4E2D\u2026</td></tr></tbody>
</table>

</div>

<script>
(function(){
  const $=s=>document.querySelector(s);

  const loginOverlay=$('#loginOverlay');
  const loginPwd=$('#loginPwd');
  const loginBtn=$('#loginBtn');
  const loginError=$('#loginError');
  const pwdToggle=$('#pwdToggle');
  const mainPanel=$('#mainPanel');
  const roomName=$('#roomName');
  const roomToken=$('#roomToken');
  const roomTTL=$('#roomTTL');
  const createBtn=$('#createBtn');
  const roomList=$('#roomList');
  const themeBtn=$('#themeBtn');
  const logoutBtn=$('#logoutBtn');
  const oldPwd=$('#oldPwd');
  const newPwd=$('#newPwd');
  const changePwdBtn=$('#changePwdBtn');
  const domainStatus=$('#domainStatus');

  const domainInput=$('#domainInput');
  const saveDomainBtn=$('#saveDomainBtn');

  let serverConfig = { domain: '', lanIP: '' };

  let sessionToken = sessionStorage.getItem('clip-relay-admin-token') || '';

  // \u4E3B\u9898
  function applyTheme(dark){
    document.documentElement.setAttribute('data-theme',dark?'dark':'');
    themeBtn.textContent=dark?'\u2600\uFE0F':'\u{1F319}';
    try{localStorage.setItem('clip-relay-theme',dark?'dark':'light')}catch(_){}
  }
  const saved=(()=>{try{return localStorage.getItem('clip-relay-theme')}catch(_){return null}})();
  const prefers=window.matchMedia('(prefers-color-scheme:dark)').matches;
  applyTheme(saved==='dark'||(!saved&&prefers));
  themeBtn.addEventListener('click',()=>{
    applyTheme(document.documentElement.getAttribute('data-theme')!=='dark');
  });

  function toast(text){
    const e=document.querySelector('.toast');
    if(e)e.remove();
    const el=document.createElement('div');
    el.className='toast';el.textContent=text;
    document.body.appendChild(el);
    setTimeout(()=>el.remove(),2000);
  }

  function api(path, opts={}){
    const headers={...opts.headers,'Authorization':'Bearer '+sessionToken};
    if(opts.body&&typeof opts.body==='object'){
      headers['Content-Type']='application/json';
      opts.body=JSON.stringify(opts.body);
    }
    return fetch(path,{...opts,headers});
  }

  // \u68C0\u67E5\u767B\u5F55\u72B6\u6001
  async function checkAuth(){
    if(!sessionToken){
      showLogin();
      return false;
    }
    try{
      const resp=await api('/api/admin/rooms');
      if(resp.status===401){sessionToken='';sessionStorage.removeItem('clip-relay-admin-token');showLogin();return false;}
      return true;
    }catch(e){toast('\u8FDE\u63A5\u5931\u8D25');return false;}
  }

  function showLogin(){
    loginOverlay.style.display='';
    mainPanel.style.display='none';
    loginError.classList.remove('show');
    loginPwd.value='';
    loginPwd.type='password';
    pwdToggle.textContent='\u{1F441}';
    loginPwd.focus();
  }

  function showLoginError(msg){
    loginError.textContent=msg;
    loginError.classList.add('show');
  }

  // \u5BC6\u7801\u53EF\u89C1\u5207\u6362
  pwdToggle.addEventListener('click',()=>{
    const show=loginPwd.type==='password';
    loginPwd.type=show?'text':'password';
    pwdToggle.textContent=show?'\u{1F648}':'\u{1F441}';
  });

  // \u767B\u5F55
  async function doLogin(){
    const pwd=loginPwd.value;
    if(!pwd){showLoginError('\u8BF7\u8F93\u5165\u5BC6\u7801');return}
    try{
      const resp=await fetch('/api/admin/login',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({password:pwd})
      });
      const data=await resp.json();
      if(data.error){showLoginError(data.error);return}
      sessionToken=data.token;
      sessionStorage.setItem('clip-relay-admin-token',sessionToken);
      loginOverlay.style.display='none';
      mainPanel.style.display='';
      loginError.classList.remove('show');
      loadRooms();
    }catch(e){showLoginError('\u7F51\u7EDC\u9519\u8BEF\uFF0C\u8BF7\u68C0\u67E5\u8FDE\u63A5')}
  }

  loginBtn.addEventListener('click',doLogin);
  loginPwd.addEventListener('keydown',e=>{if(e.key==='Enter')doLogin()});

  // \u9000\u51FA
  logoutBtn.addEventListener('click',()=>{
    sessionToken='';
    sessionStorage.removeItem('clip-relay-admin-token');
    showLogin();
  });

  // \u4FEE\u6539\u5BC6\u7801
  changePwdBtn.addEventListener('click',async()=>{
    const old=oldPwd.value;
    const nw=newPwd.value;
    if(!old||!nw){toast('\u8BF7\u586B\u5199\u539F\u5BC6\u7801\u548C\u65B0\u5BC6\u7801');return}
    if(nw.length<3){toast('\u65B0\u5BC6\u7801\u81F3\u5C113\u4E2A\u5B57\u7B26');return}
    try{
      const resp=await api('/api/admin/change-password',{
        method:'POST',
        body:{oldPassword:old,newPassword:nw}
      });
      const data=await resp.json();
      if(data.error){toast(data.error);return}
      toast('\u5BC6\u7801\u5DF2\u4FEE\u6539');
      alert('\u5BC6\u7801\u5DF2\u4FEE\u6539\u3002\u5982\u5FD8\u8BB0\u65B0\u5BC6\u7801\uFF0C\u53EF\u7528\u6062\u590D\u7801\u6062\u590D\u767B\u5F55\u3002');
      oldPwd.value='';newPwd.value='';
    }catch(e){toast('\u4FEE\u6539\u5931\u8D25')}
  });

  // \u6062\u590D\u7801
  const showRcBtn=$('#showRcBtn');
  const regenerateRcBtn=$('#regenerateRcBtn');
  const rcList=$('#rcList');
  const rcCount=$('#rcCount');

  async function loadRecoveryCodes(){
    try{
      const resp=await api('/api/admin/recovery-codes');
      const data=await resp.json();
      rcCount.textContent=\`\${data.count} \u4E2A\u53EF\u7528\`;
      if(data.codes.length>0){
        rcList.innerHTML=data.codes.map(c=>\`<div style="padding:2px 0">\xB7 \${c}</div>\`).join('');
        rcList.style.display='';
      }else{
        rcList.innerHTML='<div style="color:var(--text-muted)">\u6682\u65E0\u53EF\u7528\u6062\u590D\u7801</div>';
        rcList.style.display='';
      }
    }catch(e){}
  }

  let rcVisible=false;
  showRcBtn.addEventListener('click',async()=>{
    if(rcVisible){rcList.style.display='none';showRcBtn.textContent='\u67E5\u770B\u6062\u590D\u7801';rcVisible=false;return}
    await loadRecoveryCodes();
    rcList.style.display='';showRcBtn.textContent='\u9690\u85CF\u6062\u590D\u7801';rcVisible=true;
  });

  regenerateRcBtn.addEventListener('click',async()=>{
    if(!confirm('\u91CD\u65B0\u751F\u6210\u5C06\u4F7F\u4E4B\u524D\u7684\u6062\u590D\u7801\u5168\u90E8\u4F5C\u5E9F\uFF0C\u786E\u5B9A\uFF1F'))return;
    try{
      const resp=await api('/api/admin/recovery-codes',{method:'POST',body:{regenerate:true}});
      const data=await resp.json();
      if(data.codes){
        rcList.innerHTML=data.codes.map(c=>\`<div style="padding:2px 0">\xB7 \${c}</div>\`).join('');
        rcList.style.display='';
        rcCount.textContent=\`\${data.count} \u4E2A\u53EF\u7528\`;
        rcVisible=true;showRcBtn.textContent='\u9690\u85CF\u6062\u590D\u7801';
        toast('\u6062\u590D\u7801\u5DF2\u91CD\u65B0\u751F\u6210');
      }
    }catch(e){toast('\u64CD\u4F5C\u5931\u8D25')}
  });

  function formatTime(iso){
    const d=new Date(iso);const p=n=>String(n).padStart(2,'0');
    return \`\${d.getFullYear()}-\${p(d.getMonth()+1)}-\${p(d.getDate())} \${p(d.getHours())}:\${p(d.getMinutes())}\`;
  }

  function ttlLabel(minutes){
    if(minutes===0)return'<span class="badge badge-permanent">\u6C38\u4E45</span>';
    if(minutes<60)return\`<span class="badge badge-temp">\${minutes}\u5206\u949F</span>\`;
    if(minutes<1440)return\`<span class="badge badge-temp">\${Math.floor(minutes/60)}\u5C0F\u65F6</span>\`;
    return\`<span class="badge badge-temp">\${Math.floor(minutes/1440)}\u5929</span>\`;
  }

  async function loadRooms(){
    try{
      const resp=await api('/api/admin/rooms');
      if(resp.status===401){showLogin();return}
      const rooms=await resp.json();
      if(rooms.length===0){
        roomList.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">\u6682\u65E0\u623F\u95F4\uFF0C\u8BF7\u521B\u5EFA</td></tr>';
        return;
      }
      roomList.innerHTML=rooms.map(r=>{
        const link=\`\${location.protocol}//\${location.host}/?token=\${r.token}\`;
        const disabled=r.disabled?1:0;
        const toggleLabel=disabled?'\u542F\u7528':'\u505C\u7528';
        const toggleClass=disabled?'btn-success btn-sm':'btn-secondary btn-sm';
        const rowClass=disabled?' row-disabled':'';
        return\`<tr class="\${rowClass}">
          <td><strong>\${escapeHtml(r.name)}</strong></td>
          <td><span class="token">\${escapeHtml(r.token)}</span></td>
          <td>\${ttlLabel(r.ttl_minutes)}</td>
          <td>\${r.message_count}</td>
          <td>\${r.online_count||0}</td>
          <td style="font-size:12px;color:var(--text-muted)">\${formatTime(r.created_at)}</td>
          <td style="font-size:12px;color:var(--text-muted)">\${r.expires_at?formatTime(r.expires_at):'<span style="color:var(--text-muted)">\u2014</span>'}</td>
          <td><div class="actions">
            <button class="btn btn-secondary btn-sm" data-copy="\${escapeAttr(link)}">\u590D\u5236\u94FE\u63A5</button>
            <button class="btn btn-sm btn-toggle" data-toggle="\${escapeAttr(r.token)}">\${toggleLabel}</button>
            <button class="btn btn-secondary btn-sm" data-clear="\${escapeAttr(r.token)}">\u6E05\u7A7A</button>
            <button class="btn btn-danger btn-sm" data-delete="\${escapeAttr(r.token)}">\u5220\u9664</button>
          </div></td>
        </tr>\`;
      }).join('');

      roomList.querySelectorAll('[data-copy]').forEach(btn=>{
        btn.addEventListener('click',(e)=>{
          e.stopPropagation();
          showCopyPopover(btn, btn.dataset.copy);
        });
      });
      roomList.querySelectorAll('[data-toggle]').forEach(btn=>{
        btn.addEventListener('click',async()=>{
          const resp=await api('/api/admin/rooms/toggle',{
            method:'POST',
            body:{token:btn.dataset.toggle}
          });
          const data=await resp.json();
          if(data.error){toast(data.error);return}
          toast(data.disabled?'\u623F\u95F4\u5DF2\u505C\u7528':'\u623F\u95F4\u5DF2\u542F\u7528');
          loadRooms();
        });
      });
      roomList.querySelectorAll('[data-clear]').forEach(btn=>{
        btn.addEventListener('click',async()=>{
          if(!confirm('\u786E\u5B9A\u6E05\u7A7A\u8BE5\u623F\u95F4\u6240\u6709\u6D88\u606F\uFF1F'))return;
          await api(\`/api/admin/rooms/\${btn.dataset.clear}/messages\`,{method:'DELETE'});
          toast('\u6D88\u606F\u5DF2\u6E05\u7A7A');
          loadRooms();
        });
      });
      roomList.querySelectorAll('[data-delete]').forEach(btn=>{
        btn.addEventListener('click',async()=>{
          if(!confirm('\u786E\u5B9A\u5220\u9664\u8BE5\u623F\u95F4\uFF1F\u623F\u95F4\u548C\u6240\u6709\u6D88\u606F\u5C06\u88AB\u6C38\u4E45\u5220\u9664\u3002'))return;
          await api(\`/api/admin/rooms/\${btn.dataset.delete}\`,{method:'DELETE'});
          toast('\u623F\u95F4\u5DF2\u5220\u9664');
          loadRooms();
        });
      });
    }catch(e){
      roomList.innerHTML='<tr><td colspan="8" style="text-align:center;color:var(--danger);padding:32px">\u52A0\u8F7D\u5931\u8D25</td></tr>';
    }
  }

  async function createNewRoom(){
    const name=roomName.value.trim();
    if(!name){toast('\u8BF7\u8F93\u5165\u623F\u95F4\u540D\u79F0');return}
    const ttl=parseInt(roomTTL.value);
    const token=roomToken.value.trim()||'';
    try{
      const resp=await api('/api/admin/rooms',{
        method:'POST',
        body:{name,token,ttl_minutes:ttl}
      });
      if(resp.status===401){showLogin();return}
      const data=await resp.json();
      if(data.error){toast(data.error);return}
      toast('\u623F\u95F4\u521B\u5EFA\u6210\u529F\uFF01');
      roomName.value='';roomToken.value='';
      loadRooms();
    }catch(e){toast('\u521B\u5EFA\u5931\u8D25')}
  }

  createBtn.addEventListener('click',createNewRoom);
  roomName.addEventListener('keydown',e=>{if(e.key==='Enter')createNewRoom()});

  function escapeHtml(s){
    const d=document.createElement('div');d.textContent=s;return d.innerHTML;
  }
  function escapeAttr(s){
    return s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // \u590D\u5236\u94FE\u63A5\u5F39\u7A97
  function showCopyPopover(anchor, fullLink) {
    const existing = document.querySelector('.copy-popover');
    if (existing) existing.remove();

    const popover = document.createElement('div');
    popover.className = 'copy-popover';

    const token = fullLink.split('token=')[1] || '';

    const localLink = \`http://localhost:\${location.port}/?token=\${token}\`;
    const lanLink = serverConfig.lanIP
      ? \`http://\${serverConfig.lanIP}:\${location.port}/?token=\${token}\`
      : null;
    const domainLink = serverConfig.domain
      ? \`https://\${serverConfig.domain}/?token=\${token}\`
      : null;

    let html = '';
    html += \`<button data-link="\${escapeAttr(localLink)}">\u{1F5A5} \u672C\u673A\u8BBF\u95EE<small>\${escapeHtml(localLink)}</small></button>\`;
    if (lanLink) {
      html += \`<button data-link="\${escapeAttr(lanLink)}">\u{1F3E0} \u5C40\u57DF\u7F51\u8BBF\u95EE<small>\${escapeHtml(lanLink)}</small></button>\`;
    }
    if (domainLink) {
      html += \`<div class="divider"></div>\`;
      html += \`<button data-link="\${escapeAttr(domainLink)}">\u{1F310} \u516C\u7F51\u8BBF\u95EE<small>\${escapeHtml(domainLink)}</small></button>\`;
    }
    popover.innerHTML = html;
    document.body.appendChild(popover);

    // \u667A\u80FD\u5B9A\u4F4D\uFF1A\u7A7A\u95F4\u4E0D\u591F\u65F6\u663E\u793A\u5728\u4E0A\u65B9
    const rect = anchor.getBoundingClientRect();
    const popH = popover.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    let top;
    if (spaceBelow >= popH + 8 || spaceBelow >= spaceAbove) {
      // \u4E0B\u65B9\u7A7A\u95F4\u591F\uFF0C\u6216\u4E0B\u65B9\u7A7A\u95F4\u591A\u4E8E\u4E0A\u65B9
      top = rect.bottom + 4;
    } else {
      // \u4E0A\u65B9\u7A7A\u95F4\u66F4\u591A
      top = rect.top - popH - 4;
    }
    // \u786E\u4FDD\u4E0D\u8D85\u51FA\u5C4F\u5E55
    top = Math.max(8, Math.min(top, window.innerHeight - popH - 8));

    popover.style.top = top + 'px';
    popover.style.left = Math.min(rect.left, window.innerWidth - 240) + 'px';
    popover.style.position = 'fixed';

    popover.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        let ok = false;
        // \u4F18\u5148\u7528 execCommand\uFF08\u540C\u6B65\uFF0C\u4E0D\u4E22\u7528\u6237\u624B\u52BF\uFF09
        try {
          const ta = document.createElement('textarea');
          ta.value = b.dataset.link;
          ta.style.position = 'fixed'; ta.style.left = '-9999px'; ta.style.top = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
          ok = true;
        } catch (_) {}
        // execCommand \u5931\u8D25\u65F6\u5C1D\u8BD5 Clipboard API
        if (!ok) {
          navigator.clipboard.writeText(b.dataset.link).then(() => ok = true).catch(() => {}).finally(() => {
            toast(ok ? '\u94FE\u63A5\u5DF2\u590D\u5236\uFF01' : '\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u590D\u5236');
            popover.remove();
          });
          return;
        }
        toast('\u94FE\u63A5\u5DF2\u590D\u5236\uFF01');
        popover.remove();
      });
    });

    const close = (ev) => {
      if (!popover.contains(ev.target) && ev.target !== anchor) {
        popover.remove();
        document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
  }

  async function loadConfig() {
    try {
      const resp = await fetch('/api/config');
      serverConfig = await resp.json();
      domainInput.value = serverConfig.domain || '';
      if (serverConfig.domain) {
        domainStatus.textContent = '\u5DF2\u914D\u7F6E: ' + serverConfig.domain;
        domainStatus.className = 'domain-status set';
      } else {
        domainStatus.textContent = '\u672A\u914D\u7F6E';
        domainStatus.className = 'domain-status unset';
      }
    } catch (_) {}
  }

  // \u4FDD\u5B58\u57DF\u540D
  saveDomainBtn.addEventListener('click', async () => {
    const domain = domainInput.value.trim();
    try {
      const resp = await api('/api/admin/domain', {
        method: 'POST',
        body: { domain }
      });
      if (resp.status === 401) { showLogin(); return; }
      const data = await resp.json();
      if (data.error) { toast(data.error); return; }
      serverConfig.domain = data.domain;
      domainStatus.textContent = '\u5DF2\u914D\u7F6E: ' + data.domain;
      domainStatus.className = 'domain-status set';
      toast('\u57DF\u540D\u5DF2\u4FDD\u5B58');
    } catch (e) { toast('\u4FDD\u5B58\u5931\u8D25'); }
  });

  // \u521D\u59CB\u5316\uFF1A\u68C0\u67E5\u767B\u5F55\u72B6\u6001
  (async()=>{
    await loadConfig();
    const authed=await checkAuth();
    if(authed){
      loginOverlay.style.display='none';
      mainPanel.style.display='';
      loadRooms();
    }
  })();
})();
<\/script>
</body>
</html>
`;

// ../../src/cloudflare/worker.ts
var sessions = /* @__PURE__ */ new Map();
var SESSION_TTL = 24 * 60 * 60 * 1e3;
function createSession() {
  const token = crypto.randomUUID();
  sessions.set(token, { createdAt: Date.now() });
  return token;
}
__name(createSession, "createSession");
function validateSession(auth) {
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  if (Date.now() - s.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return false;
  }
  return true;
}
__name(validateSession, "validateSession");
function hashPassword(pw) {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw)).then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join(""));
}
__name(hashPassword, "hashPassword");
var rateLimitMap = /* @__PURE__ */ new Map();
var RATE_LIMIT_MAX = 5;
var RATE_LIMIT_WINDOW = 6e4;
var RATE_LIMIT_BLOCK = 3e5;
function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { count: 0, firstAttempt: now, blockedUntil: 0 };
    rateLimitMap.set(ip, entry);
  }
  if (entry.blockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((entry.blockedUntil - now) / 1e3) };
  }
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.firstAttempt = now;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK;
    const remainSec = Math.ceil(RATE_LIMIT_BLOCK / 1e3);
    return { blocked: true, remainingSeconds: remainSec, message: `\u5C1D\u8BD5\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF7${remainSec}\u79D2\u540E\u518D\u8BD5` };
  }
  return { blocked: false, remaining: RATE_LIMIT_MAX - entry.count };
}
__name(checkRateLimit, "checkRateLimit");
function getClientIP(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}
__name(getClientIP, "getClientIP");
async function getSetting(key) {
  const stmt = globalThis.env.DB.prepare("SELECT value FROM settings WHERE key = ?");
  const row = await stmt.bind(key).first();
  return row?.value || null;
}
__name(getSetting, "getSetting");
async function setSetting(key, value) {
  await globalThis.env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)").bind(key, value).run();
}
__name(setSetting, "setSetting");
async function getRecoveryCodes() {
  const raw = await getSetting("recovery_codes");
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
__name(getRecoveryCodes, "getRecoveryCodes");
async function setRecoveryCodes(codes) {
  await setSetting("recovery_codes", JSON.stringify(codes));
}
__name(setRecoveryCodes, "setRecoveryCodes");
function generateRecoveryCode() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const seg = /* @__PURE__ */ __name(() => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""), "seg");
  return `${seg()}-${seg()}-${seg()}`;
}
__name(generateRecoveryCode, "generateRecoveryCode");
function generateRecoveryCodes(count = 5) {
  return Array.from({ length: count }, () => generateRecoveryCode());
}
__name(generateRecoveryCodes, "generateRecoveryCodes");
async function handleLogin(request, env) {
  const ip = getClientIP(request);
  const limit = checkRateLimit(ip);
  if (limit.blocked) {
    return new Response(JSON.stringify({ error: limit.message || `\u5C1D\u8BD5\u6B21\u6570\u8FC7\u591A\uFF0C\u8BF7${limit.remainingSeconds}\u79D2\u540E\u518D\u8BD5` }), {
      status: 429,
      headers: { "Content-Type": "application/json" }
    });
  }
  const body = await request.json();
  if (!body || !body.password) {
    return new Response(JSON.stringify({ error: "\u8BF7\u8F93\u5165\u5BC6\u7801" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const inputHash = await hashPassword(body.password);
  const storedHash = await getSetting("admin_password");
  if (inputHash === storedHash) {
    rateLimitMap.delete(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const codes = await getRecoveryCodes();
  const idx = codes.indexOf(body.password);
  if (idx !== -1) {
    codes.splice(idx, 1);
    await setRecoveryCodes(codes);
    await setSetting("admin_password", inputHash);
    rateLimitMap.delete(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken, recovered: true }), {
      headers: { "Content-Type": "application/json" }
    });
  }
  const hint = limit.remaining <= 1 ? "" : "";
  return new Response(JSON.stringify({ error: `\u5BC6\u7801\u9519\u8BEF\uFF0C\u8FD8\u5269${limit.remaining}\u6B21\u5C1D\u8BD5${hint}` }), {
    status: 401,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleLogin, "handleLogin");
async function handleChangePassword(request, env) {
  const auth = request.headers.get("Authorization") || "";
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const body = await request.json();
  if (!body || !body.oldPassword || !body.newPassword) {
    return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u53C2\u6570" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const storedHash = await getSetting("admin_password");
  const oldInputHash = await hashPassword(body.oldPassword);
  if (oldInputHash !== storedHash) {
    const codes = await getRecoveryCodes();
    if (codes.indexOf(body.oldPassword) === -1) {
      return new Response(JSON.stringify({ error: "\u539F\u5BC6\u7801\u9519\u8BEF" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  }
  const newHash = await hashPassword(body.newPassword);
  await setSetting("admin_password", newHash);
  return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
}
__name(handleChangePassword, "handleChangePassword");
async function handleGetRooms() {
  const db = globalThis.env.DB;
  const { results: rooms } = await db.prepare("SELECT * FROM rooms WHERE disabled != 2 ORDER BY created_at DESC").all();
  const enriched = [];
  for (const r of rooms || []) {
    const msgCount = await db.prepare("SELECT COUNT(*) as count FROM messages WHERE room_token = ?").bind(r.token).first();
    enriched.push({
      ...r,
      message_count: msgCount?.count || 0,
      online_count: 0
    });
  }
  return new Response(JSON.stringify(enriched), { headers: { "Content-Type": "application/json" } });
}
__name(handleGetRooms, "handleGetRooms");
async function handleCreateRoom(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const body = await request.json();
  if (!body || !body.name) {
    return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u623F\u95F4\u540D\u79F0" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const token = body.token || generateToken(body.name);
  const ttl = body.ttl_minutes !== void 0 ? body.ttl_minutes : 30;
  const createdAt = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 6e4).toISOString() : null;
  await globalThis.env.DB.prepare(`
    INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, expires_at, disabled)
    VALUES (?, ?, ?, ?, ?, 0)
  `).bind(token, body.name, ttl, createdAt, expiresAt).run();
  return new Response(JSON.stringify({ token, name: body.name, ttl_minutes: ttl, created_at: createdAt, expires_at: expiresAt, disabled: 0 }), {
    status: 201,
    headers: { "Content-Type": "application/json" }
  });
}
__name(handleCreateRoom, "handleCreateRoom");
async function handleDeleteRoom(url, request) {
  const auth = request.headers.get("Authorization") || "";
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const parts = url.pathname.replace(/\/$/, "").split("/");
  const token = decodeURIComponent(parts[4]);
  if (parts.length === 6 && parts[5] === "messages") {
    await globalThis.env.DB.prepare("DELETE FROM messages WHERE room_token = ?").bind(token).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  if (parts.length === 5 && token) {
    await globalThis.env.DB.prepare("DELETE FROM rooms WHERE token = ?").bind(token).run();
    await globalThis.env.DB.prepare("DELETE FROM messages WHERE room_token = ?").bind(token).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  }
  return new Response(JSON.stringify({ error: "\u65E0\u6548\u8BF7\u6C42" }), { status: 400, headers: { "Content-Type": "application/json" } });
}
__name(handleDeleteRoom, "handleDeleteRoom");
async function handleToggleRoom(request) {
  const auth = request.headers.get("Authorization") || "";
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const body = await request.json();
  if (!body || !body.token) {
    return new Response(JSON.stringify({ error: "\u7F3A\u5C11 token" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }
  const room = await globalThis.env.DB.prepare("SELECT * FROM rooms WHERE token = ?").bind(body.token).first();
  if (!room) {
    return new Response(JSON.stringify({ error: "\u623F\u95F4\u4E0D\u5B58\u5728" }), { status: 404, headers: { "Content-Type": "application/json" } });
  }
  const newDisabled = room.disabled ? 0 : 1;
  await globalThis.env.DB.prepare("UPDATE rooms SET disabled = ? WHERE token = ?").bind(newDisabled, body.token).run();
  return new Response(JSON.stringify({ ok: true, disabled: newDisabled }), { headers: { "Content-Type": "application/json" } });
}
__name(handleToggleRoom, "handleToggleRoom");
function generateToken(prefix) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  if (prefix) {
    const clean = prefix.replace(/[^a-zA-Z0-9一-龥]/g, "").replace(/\s+/g, "-").substring(0, 20);
    return clean + "-" + result;
  }
  return result.slice(0, 4) + "-" + result.slice(4, 8) + "-" + result.slice(8, 12);
}
__name(generateToken, "generateToken");
var worker_default = {
  async fetch(request, env) {
    globalThis.env = env;
    try {
      await env.DB.exec("CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_token TEXT NOT NULL, content TEXT NOT NULL, msg_type TEXT NOT NULL DEFAULT 'text', filename TEXT, created_at TEXT NOT NULL)");
      await env.DB.exec("CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_token, id)");
      await env.DB.exec("CREATE TABLE IF NOT EXISTS rooms (token TEXT PRIMARY KEY, name TEXT NOT NULL, ttl_minutes INTEGER NOT NULL DEFAULT 30, created_at TEXT NOT NULL, expires_at TEXT, disabled INTEGER NOT NULL DEFAULT 0)");
      try {
        await env.DB.exec("ALTER TABLE rooms ADD COLUMN expires_at TEXT");
      } catch (e) {
      }
      await env.DB.exec("CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
    } catch (e) {
      console.error("D1 init failed:", e.message);
    }
    {
      const adminPwd = env.ADMIN_PASSWORD || "admin";
      const adminHash = await hashPassword(adminPwd);
      const storedHash = await getSetting("admin_password");
      if (!storedHash) {
        await setSetting("admin_password", adminHash);
        let codes;
        if (env.RECOVERY_CODES) {
          codes = env.RECOVERY_CODES.split(",").map((s) => s.trim()).filter((s) => s);
        } else {
          codes = generateRecoveryCodes(5);
        }
        await setRecoveryCodes(codes);
        console.log("\u6062\u590D\u7801:", codes);
      }
    }
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    const isWsPath = path === "/ws" || path.startsWith("/ws?") || path === "/" || path.startsWith("/?");
    if (isWsPath && request.headers.get("Upgrade") === "websocket") {
      const token = url.searchParams.get("token");
      if (!token) {
        return new Response("Missing token", { status: 400 });
      }
      const id = env.ROOM.idFromName(token);
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }
    if (path === "/api/config") {
      const domain = await getSetting("domain") || "";
      return new Response(JSON.stringify({
        defaultToken: env.DEFAULT_TOKEN || "clip-relay",
        maxImageSize: parseInt(env.MAX_IMAGE_SIZE || "5242880"),
        domain,
        lanIP: ""
      }), { headers: { "Content-Type": "application/json" } });
    }
    if (path === "/api/admin/login" && request.method === "POST") {
      return handleLogin(request, env);
    }
    if (path === "/api/admin/change-password" && request.method === "POST") {
      return handleChangePassword(request, env);
    }
    const auth = request.headers.get("Authorization") || "";
    const isAuthenticated = validateSession(auth);
    if (path.startsWith("/api/admin/") && !path.includes("/login") && !path.includes("/change-password")) {
      if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
    }
    if (path === "/api/admin/rooms" && request.method === "GET") {
      return handleGetRooms();
    }
    if (path === "/api/admin/rooms" && request.method === "POST") {
      return handleCreateRoom(request);
    }
    if (path.startsWith("/api/admin/rooms/") && request.method === "DELETE") {
      return handleDeleteRoom(url, request);
    }
    if (path === "/api/admin/rooms/toggle" && request.method === "POST") {
      return handleToggleRoom(request);
    }
    if (path === "/api/admin/recovery-codes" && request.method === "GET") {
      const codes = await getRecoveryCodes();
      return new Response(JSON.stringify({ codes, count: codes.length }), { headers: { "Content-Type": "application/json" } });
    }
    if (path === "/api/admin/recovery-codes" && request.method === "POST") {
      const body = await request.json();
      if (body && body.regenerate === true) {
        const newCodes = generateRecoveryCodes(5);
        await setRecoveryCodes(newCodes);
        return new Response(JSON.stringify({ codes: newCodes, count: newCodes.length }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "\u65E0\u6548\u8BF7\u6C42" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    if (path === "/api/admin/domain" && request.method === "POST") {
      const auth2 = request.headers.get("Authorization") || "";
      if (!validateSession(auth2)) {
        return new Response(JSON.stringify({ error: "\u672A\u767B\u5F55" }), { status: 401, headers: { "Content-Type": "application/json" } });
      }
      const body = await request.json();
      if (!body || typeof body.domain !== "string") {
        return new Response(JSON.stringify({ error: "\u7F3A\u5C11\u57DF\u540D\u53C2\u6570" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      const domain = body.domain.trim();
      await setSetting("domain", domain);
      return new Response(JSON.stringify({ ok: true, domain }), { headers: { "Content-Type": "application/json" } });
    }
    if (path === "/admin") {
      return new Response(ADMIN_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }
    if ((path === "/" || path === "/index.html") && !url.searchParams.has("token")) {
      return Response.redirect(`${url.origin}/admin`, 302);
    }
    return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-DpJVV5/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-DpJVV5/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  Room,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
