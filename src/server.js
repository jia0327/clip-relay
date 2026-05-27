const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const {
  initDB, addMessage, addImageMessage, getRoomMessages, deleteRoomMessages, cleanupOldMessages,
  createRoom, getRoomConfig, listRooms, deleteRoom, countRoomMessages, toggleRoom,
  getSetting, setSetting, initDefaultAdmin
} = require('./db');
const { RoomManager } = require('./room');

// --- 配置 ---
let config = { defaultToken: '', port: 3000, maxImageSize: 5 * 1024 * 1024 };
try {
  const configData = fs.readFileSync(path.join(__dirname, '../config/config.json'), 'utf-8');
  config = { ...config, ...JSON.parse(configData) };
} catch (_) {}

const PORT = process.env.PORT || config.port;
const MAX_PAYLOAD = config.maxImageSize + 1024 * 1024;
const roomManager = new RoomManager();

// --- Static file MIME types ---
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

function serveStatic(req, res) {
  const urlPath = req.url.split('?')[0];
  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  filePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
  const fullPath = path.join(__dirname, '../public', filePath);

  if (!fullPath.startsWith(path.join(__dirname, '../public'))) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(fullPath);
  const contentType = MIME[ext] || 'application/octet-stream';

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Not Found');
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function jsonResponse(res, data, status) {
  res.writeHead(status || 200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve(null); }
    });
  });
}

// --- 恢复码 ---
function generateRecoveryCode() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // 不含 0/o/1/l
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg()}-${seg()}-${seg()}`;
}

function generateRecoveryCodes(count = 5) {
  return Array.from({ length: count }, () => generateRecoveryCode());
}

function getRecoveryCodes() {
  try { return JSON.parse(getSetting('recovery_codes') || '[]'); } catch { return []; }
}

function setRecoveryCodes(codes) {
  setSetting('recovery_codes', JSON.stringify(codes));
}

// --- Session 管理 ---
const sessions = new Map();
const SESSION_TTL = 24 * 60 * 60 * 1000;

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function validateSession(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  if (Date.now() - s.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw).digest('hex');
}

// 定期清理过期 session
setInterval(() => {
  for (const [token, s] of sessions) {
    if (Date.now() - s.createdAt > SESSION_TTL) sessions.delete(token);
  }
}, 3600 * 1000);

// --- 登录限流 ---
const rateLimitMap = new Map(); // ip → { count, firstAttempt, blockedUntil }
const RATE_LIMIT_MAX = 5;       // 最多尝试次数
const RATE_LIMIT_WINDOW = 60000; // 1分钟窗口
const RATE_LIMIT_BLOCK = 300000; // 封禁5分钟

function checkRateLimit(ip) {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { count: 0, firstAttempt: now, blockedUntil: 0 };
    rateLimitMap.set(ip, entry);
  }
  // 封禁中
  if (entry.blockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  // 窗口过期，重置
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.firstAttempt = now;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK;
    const remainSec = Math.ceil(RATE_LIMIT_BLOCK / 1000);
    return { blocked: true, remainingSeconds: remainSec, message: `尝试次数过多，请${remainSec}秒后再试。如忘记密码，请查看 config.json 中的 resetKey 字段。` };
  }
  return { blocked: false, remaining: RATE_LIMIT_MAX - entry.count };
}

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || req.socket.remoteAddress
    || 'unknown';
}

// 定期清理限流记录
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (entry.blockedUntil < now && now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

// --- HTTP Server ---
const server = http.createServer(async (req, res) => {
  const urlPath = req.url.split('?')[0];
  const urlParams = new URLSearchParams(req.url.split('?')[1] || '');

  // 首页无 token → 跳转到管理后台
  if ((urlPath === '/' || urlPath === '/index.html') && !urlParams.has('token')) {
    res.writeHead(302, { 'Location': '/admin' });
    res.end();
    return;
  }

  // --- API ---
  if (urlPath === '/api/config') {
    const os = require('os');
    const ifs = os.networkInterfaces();
    // 排除虚拟/隧道网卡的关键词
    const virtualKeys = ['tailscale','vethernet','docker','hyper-v','virtualbox','vmware','vpn','tunnel','teredo','loopback','pseudo','bluetooth','wsl'];
    let lanIP = '';
    // 优先匹配物理网卡（以太网/Wi-Fi/en/eth/wlan）
    for (const key of Object.keys(ifs)) {
      const lower = key.toLowerCase();
      if (virtualKeys.some(k => lower.includes(k))) continue;
      for (const iface of ifs[key]) {
        if (iface.family === 'IPv4' && !iface.internal
          && !iface.address.startsWith('169.254')  // APIPA/link-local
          && !iface.address.startsWith('127.')) {
          lanIP = iface.address;
          break;
        }
      }
      if (lanIP) break;
    }
    jsonResponse(res, {
      defaultToken: config.defaultToken,
      maxImageSize: config.maxImageSize,
      domain: config.domain || '',
      lanIP
    });
    return;
  }

  // 登录 API（无需认证，有限流）
  if (urlPath === '/api/admin/login' && req.method === 'POST') {
    const ip = getClientIP(req);
    const limit = checkRateLimit(ip);
    if (limit.blocked) {
      jsonResponse(res, { error: limit.message || `尝试次数过多，请${limit.remainingSeconds}秒后再试` }, 429);
      return;
    }
    const body = await readBody(req);
    if (!body || !body.password) {
      jsonResponse(res, { error: '请输入密码' }, 400);
      return;
    }
    // 检查配置文件中的恢复密码
    let storedHash = getSetting('admin_password');
    if (config.resetKey && hashPassword(body.password) === hashPassword(config.resetKey)) {
      // 用重置密钥恢复：更新 DB 中的密码
      if (hashPassword(config.resetKey) !== storedHash) {
        setSetting('admin_password', hashPassword(config.resetKey));
      }
      const sessionToken = createSession();
      rateLimitMap.delete(ip);
      jsonResponse(res, { token: sessionToken, recovered: true });
      return;
    }
    const inputHash = hashPassword(body.password);
    if (inputHash !== storedHash) {
      // 检查恢复码
      const codes = getRecoveryCodes();
      const rcIdx = codes.indexOf(body.password);
      if (rcIdx !== -1) {
        codes.splice(rcIdx, 1);
        setRecoveryCodes(codes);
        setSetting('admin_password', inputHash);
        const sessionToken = createSession();
        rateLimitMap.delete(ip);
        jsonResponse(res, { token: sessionToken, recovered: true });
        return;
      }
      const hint = limit.remaining <= 1 ? '，忘记密码请查看 config.json 中的 resetKey 字段' : '';
      jsonResponse(res, { error: `密码错误，还剩${limit.remaining}次尝试${hint}` }, 401);
      return;
    }
    rateLimitMap.delete(ip);
    const sessionToken = createSession();
    jsonResponse(res, { token: sessionToken });
    return;
  }

  // 恢复码 API
  if (urlPath === '/api/admin/recovery-codes' && req.method === 'GET') {
    const codes = getRecoveryCodes();
    jsonResponse(res, { codes, count: codes.length });
    return;
  }
  if (urlPath === '/api/admin/recovery-codes' && req.method === 'POST') {
    const body = await readBody(req);
    if (body && body.regenerate === true) {
      const newCodes = generateRecoveryCodes(5);
      setRecoveryCodes(newCodes);
      jsonResponse(res, { codes: newCodes, count: newCodes.length });
      return;
    }
    jsonResponse(res, { error: '无效请求' }, 400);
    return;
  }

  // 更新域名配置 API（需要认证）
  if (urlPath === '/api/admin/domain' && req.method === 'POST') {
    if (!validateSession(req)) { jsonResponse(res, { error: '未登录' }, 401); return; }
    const body = await readBody(req);
    if (!body || typeof body.domain !== 'string') {
      jsonResponse(res, { error: '缺少域名参数' }, 400);
      return;
    }
    config.domain = body.domain.trim();
    // 写回 config.json
    try {
      fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config, null, 2), 'utf-8');
    } catch (e) {
      jsonResponse(res, { error: '配置文件写入失败' }, 500);
      return;
    }
    jsonResponse(res, { ok: true, domain: config.domain });
    return;
  }

  // 修改密码 API（需要认证）
  if (urlPath === '/api/admin/change-password' && req.method === 'POST') {
    if (!validateSession(req)) { jsonResponse(res, { error: '未登录' }, 401); return; }
    const body = await readBody(req);
    if (!body || !body.oldPassword || !body.newPassword) {
      jsonResponse(res, { error: '缺少参数' }, 400);
      return;
    }
    const storedHash = getSetting('admin_password');
    if (hashPassword(body.oldPassword) !== storedHash) {
      const codes = getRecoveryCodes();
      if (codes.indexOf(body.oldPassword) === -1) {
        jsonResponse(res, { error: '原密码错误' }, 401);
        return;
      }
    }
    const newHash = hashPassword(body.newPassword);
    setSetting('admin_password', newHash);
    config.adminPassword = body.newPassword;
    try {
      fs.writeFileSync(path.join(__dirname, '../config/config.json'), JSON.stringify(config, null, 2), 'utf-8');
    } catch (_) {}
    jsonResponse(res, { ok: true });
    return;
  }

  // 管理 API（需要认证）
  if (urlPath.startsWith('/api/admin/') && !urlPath.includes('/login') && !urlPath.includes('/change-password')) {
    if (!validateSession(req)) { jsonResponse(res, { error: '未登录' }, 401); return; }
  }

  if (urlPath === '/api/admin/rooms' && req.method === 'GET') {
    const rooms = listRooms();
    const enriched = rooms.map(r => ({
      ...r,
      message_count: countRoomMessages(r.token),
      online_count: roomManager.getConnectionCount(r.token),
    }));
    jsonResponse(res, enriched);
    return;
  }

  if (urlPath === '/api/admin/rooms' && req.method === 'POST') {
    const body = await readBody(req);
    if (!body || !body.name) {
      jsonResponse(res, { error: '缺少房间名称' }, 400);
      return;
    }
    const token = body.token || generateToken(body.name);
    const ttl = body.ttl_minutes !== undefined ? body.ttl_minutes : 30;
    const room = createRoom(token, body.name, ttl);
    // 预先在 RoomManager 中创建房间
    roomManager.getOrCreate(token, ttl);
    jsonResponse(res, room, 201);
    return;
  }

  if (urlPath.startsWith('/api/admin/rooms/') && req.method === 'DELETE') {
    const parts = urlPath.replace(/\/$/, '').split('/');
    const token = decodeURIComponent(parts[4]);
    // /api/admin/rooms/:token/messages → 清空消息
    if (parts.length === 6 && parts[5] === 'messages') {
      deleteRoomMessages(token);
      jsonResponse(res, { ok: true });
      return;
    }
    // /api/admin/rooms/:token → 删除房间
    if (parts.length === 5 && token) {
      deleteRoom(token);
      jsonResponse(res, { ok: true });
      return;
    }
    jsonResponse(res, { error: '无效请求' }, 400);
    return;
  }

  // 启用/停用房间 toggle API
  if (urlPath === '/api/admin/rooms/toggle' && req.method === 'POST') {
    if (!validateSession(req)) { jsonResponse(res, { error: '未登录' }, 401); return; }
    const body = await readBody(req);
    if (!body || !body.token) {
      jsonResponse(res, { error: '缺少 token' }, 400);
      return;
    }
    const disabled = toggleRoom(body.token);
    jsonResponse(res, { ok: true, disabled });
    return;
  }

  // /admin → /admin.html
  if (urlPath === '/admin') {
    const adminPath = path.join(__dirname, '../public', 'admin.html');
    fs.readFile(adminPath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not Found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  if (req.method === 'GET') {
    serveStatic(req, res);
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

// --- WebSocket Server ---
const wss = new WebSocket.Server({ server, maxPayload: MAX_PAYLOAD });

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url?.split('?')[1] || '');
  const token = params.get('token');

  if (!token) {
    ws.send(JSON.stringify({ type: 'error', message: 'Missing token parameter' }));
    ws.close(4000, 'Missing token');
    return;
  }

  // 从 DB 加载房间配置
  const roomCfg = getRoomConfig(token);
  if (roomCfg) {
    if (roomCfg.disabled) {
      ws.send(JSON.stringify({ type: 'error', message: '房间已停用，请联系管理员' }));
      ws.close(4002, 'Room disabled');
      return;
    }
    roomManager.getOrCreate(token, roomCfg.ttl_minutes);
  }

  if (roomManager.isExpired(token)) {
    ws.send(JSON.stringify({ type: 'error', message: 'Room has expired' }));
    ws.close(4001, 'Room expired');
    return;
  }

  let deviceType = 'desktop';

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
      return;
    }

    switch (msg.type) {
      case 'join': {
        deviceType = msg.device_type || 'desktop';

        if (roomManager.isExpired(token)) {
          ws.send(JSON.stringify({ type: 'room_expired' }));
          ws.close(4001, 'Room expired');
          return;
        }

        // 首次使用的 token 自动注册到 rooms 表（方便后台管理）
        if (!getRoomConfig(token)) {
          const ttl = roomManager.get(token)?.ttlMs === 0 ? 0 : 30;
          createRoom(token, '临时房间', ttl);
        }

        roomManager.addConnection(token, ws, deviceType);

        const messages = getRoomMessages(token);
        const room = roomManager.get(token);
        const expiresIn = roomManager.getExpiresIn(token);
        const roomCfg2 = getRoomConfig(token);
        ws.send(JSON.stringify({
          type: 'joined',
          messages,
          room_name: roomCfg2 ? roomCfg2.name : null,
          room_created_at: new Date(room.createdAt).toISOString(),
          expires_in: expiresIn,
          permanent: expiresIn === -1,
          online_count: roomManager.getConnectionCount(token),
          online_devices: roomManager.getDeviceTypes(token)
        }));

        roomManager.notifyDeviceJoined(token, ws, deviceType);
        break;
      }

      case 'ping': {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;
      }

      case 'clear_messages': {
        deleteRoomMessages(token);
        roomManager.broadcastAll(token, { type: 'messages_cleared' });
        break;
      }

      case 'message': {
        if (!msg.content || typeof msg.content !== 'string' || msg.content.trim().length === 0) {
          ws.send(JSON.stringify({ type: 'error', message: 'Empty message' }));
          return;
        }

        const record = addMessage(token, msg.content);

        roomManager.broadcast(token, ws, {
          type: 'message',
          message: record
        });
        break;
      }

      case 'image': {
        if (!msg.content || typeof msg.content !== 'string') {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid image data' }));
          return;
        }

        if (!msg.content.startsWith('data:image/')) {
          ws.send(JSON.stringify({ type: 'error', message: 'Invalid image format, expected data:image/...' }));
          return;
        }

        const base64Len = msg.content.includes(',') ? msg.content.split(',')[1].length : 0;
        const byteSize = Math.ceil(base64Len * 3 / 4);
        if (byteSize > config.maxImageSize) {
          ws.send(JSON.stringify({ type: 'error', message: `Image too large, max ${Math.round(config.maxImageSize / 1024 / 1024)}MB` }));
          return;
        }

        const record = addImageMessage(token, msg.content, msg.filename || 'image.png');

        roomManager.broadcast(token, ws, {
          type: 'image',
          message: record
        });
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', message: `Unknown message type: ${msg.type}` }));
    }
  });

  ws.on('close', () => {
    const info = roomManager.removeConnection(token, ws);
    if (info) {
      roomManager.notifyDeviceLeft(token, ws, info.deviceType);
    }
  });

  ws.on('error', () => {
    roomManager.removeConnection(token, ws);
  });
});

// --- 定期清理 ---
const CLEANUP_INTERVAL = 60 * 1000;
setInterval(() => {
  const expired = roomManager.cleanupExpired();
  for (const token of expired) {
    deleteRoom(token);
  }
  cleanupOldMessages();
}, CLEANUP_INTERVAL);

// --- 工具函数 ---
function generateToken(prefix) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  if (prefix) {
    // 清理房间名：只保留字母数字和中文，空格转连字符
    const clean = prefix.replace(/[^a-zA-Z0-9一-龥]/g, '').replace(/\s+/g, '-').substring(0, 20);
    return clean + '-' + result;
  }
  return result.slice(0, 4) + '-' + result.slice(4, 8) + '-' + result.slice(8, 12);
}

// --- 启动 ---
async function start() {
  await initDB();
  initDefaultAdmin();

  // 首次启动时生成恢复码
  const existingCodes = getRecoveryCodes();
  if (existingCodes.length === 0) {
    const codes = generateRecoveryCodes(5);
    setRecoveryCodes(codes);
    console.log(`[clip-relay] 管理员恢复码: ${codes.join('  ')}`);
  }

  // 如果配置文件未设置密码
  if (!config.adminPassword) {
    const dbHash = getSetting('admin_password');
    // 首次部署，初始化密码
    const newPwd = config.adminPassword || generateToken().replace(/-/g, '');
    setSetting('admin_password', hashPassword(newPwd));
    if (!config.adminPassword) {
      config.adminPassword = newPwd;
      try { fs.writeFileSync(path.join(__dirname, '../config/config.json'), JSON.stringify(config, null, 2), 'utf-8'); } catch (_) {}
    }
    console.log(`[clip-relay] 管理员密码: ${config.adminPassword}`);
    console.log('[clip-relay] 重置密钥（忘记密码时使用）: ' + (config.resetKey || '(未设置，默认同管理员密码)'));
  } else {
    console.log('[clip-relay] 使用已有管理员密码（来自数据库）');
  }

  const adminPwd = config.adminPassword || getSetting('admin_password');
  server.listen(PORT, () => {
    console.log(`[clip-relay] 服务已启动 → http://0.0.0.0:${PORT}`);
    console.log(`[clip-relay] 管理后台 → http://0.0.0.0:${PORT}/admin`);
    console.log(`[clip-relay] 管理员密码: ${typeof adminPwd === 'string' && adminPwd.length < 64 ? adminPwd : '(已设置)'}`);
    console.log('[clip-relay] 房间有效期: 30分钟（可通过后台设为永久）');
    console.log(`[clip-relay] 数据目录: ${path.join(__dirname, '../data')}`);
  });
}

start().catch((err) => {
  console.error('启动失败:', err);
  process.exit(1);
});
