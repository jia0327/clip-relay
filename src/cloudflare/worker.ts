import type { DurableObjectNamespace, D1Database } from '@cloudflare/workers-types';
import { Room } from './room';
import { INDEX_HTML, ADMIN_HTML } from './static_pages';
import { createSession, validateSession, cleanupExpiredSessions } from './session-store';
import { checkRateLimit, clearRateLimit } from './rate-limit-store';

const { generateToken } = require('../shared/token');

export interface Env {
  DB: D1Database;
  ROOM: DurableObjectNamespace;
  MAX_IMAGE_SIZE: string;
  DEFAULT_TOKEN: string;
  RESET_KEY?: string;
}

async function hashPassword(pw: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getClientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

// --- Storage helpers ---
async function getSetting(key: string): Promise<string | null> {
  const stmt = (globalThis as any).env.DB.prepare('SELECT value FROM settings WHERE key = ?');
  const row = await stmt.bind(key).first() as any;
  return row?.value || null;
}

async function setSetting(key: string, value: string) {
  await (globalThis as any).env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, value).run();
}

async function handleLogin(request: Request, env: Env): Promise<Response> {
  const ip = getClientIP(request);
  const limit = await checkRateLimit(ip);
  if (limit.blocked) {
    return new Response(JSON.stringify({ error: limit.message || `尝试次数过多，请${limit.remainingSeconds}秒后再试` }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const body = await request.json() as any;
  if (!body || !body.password) {
    return new Response(JSON.stringify({ error: '请输入密码' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const inputHash = await hashPassword(body.password);
  const storedHash = await getSetting('admin_password');

  // 密码匹配
  if (inputHash === storedHash) {
    await clearRateLimit(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 恢复：匹配 RESET_KEY → 重置为 admin
  if (env.RESET_KEY && body.password === env.RESET_KEY) {
    await setSetting('admin_password', await hashPassword('admin'));
    await clearRateLimit(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken, recovered: true, message: '密码已重置为 admin，请及时修改密码' }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const hint = (limit as any).remaining <= 1 ? '' : '';
  return new Response(JSON.stringify({ error: `密码错误，还剩${(limit as any).remaining}次尝试${hint}` }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!await validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json() as any;
  if (!body || !body.oldPassword || !body.newPassword) {
    return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const storedHash = await getSetting('admin_password');
  const oldInputHash = await hashPassword(body.oldPassword);

  // 允许用 RESET_KEY 作为原密码
  if (oldInputHash !== storedHash && !(env.RESET_KEY && body.oldPassword === env.RESET_KEY)) {
    return new Response(JSON.stringify({ error: '原密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const newHash = await hashPassword(body.newPassword);
  await setSetting('admin_password', newHash);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleGetRooms(): Promise<Response> {
  const db = (globalThis as any).env.DB;
  // 清理过期房间（用参数化的 ISO 格式确保比较正确）
  const now = new Date().toISOString();
  await db.prepare("DELETE FROM rooms WHERE expires_at IS NOT NULL AND expires_at < ?1").bind(now).run();
  await db.prepare("DELETE FROM messages WHERE room_token NOT IN (SELECT token FROM rooms)").run();

  const { results: rooms } = await db.prepare("SELECT * FROM rooms WHERE disabled != 2 ORDER BY created_at DESC").all();

  const enriched = [];
  for (const r of (rooms || [])) {
    const msgCount = await db.prepare('SELECT COUNT(*) as count FROM messages WHERE room_token = ?').bind(r.token).first() as any;
    enriched.push({
      ...r,
      message_count: msgCount?.count || 0,
      online_count: 0
    });
  }

  return new Response(JSON.stringify(enriched), { headers: { 'Content-Type': 'application/json' } });
}

async function handleCreateRoom(request: Request): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!await validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json() as any;
  if (!body || !body.name) {
    return new Response(JSON.stringify({ error: '缺少房间名称' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const token = body.token || generateToken(body.name);
  const ttl = body.ttl_minutes !== undefined ? body.ttl_minutes : 30;
  const createdAt = new Date().toISOString();
  const expiresAt = ttl > 0 ? new Date(Date.now() + ttl * 60000).toISOString() : null;

  await (globalThis as any).env.DB.prepare(`
    INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, expires_at, disabled)
    VALUES (?, ?, ?, ?, ?, 0)
  `).bind(token, body.name, ttl, createdAt, expiresAt).run();

  return new Response(JSON.stringify({ token, name: body.name, ttl_minutes: ttl, created_at: createdAt, expires_at: expiresAt, disabled: 0 }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDeleteRoom(url: URL, request: Request): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!await validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const parts = url.pathname.replace(/\/$/, '').split('/');
  const token = decodeURIComponent(parts[4]);

  if (parts.length === 6 && parts[5] === 'messages') {
    await (globalThis as any).env.DB.prepare('DELETE FROM messages WHERE room_token = ?').bind(token).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (parts.length === 5 && token) {
    await (globalThis as any).env.DB.prepare('DELETE FROM rooms WHERE token = ?').bind(token).run();
    await (globalThis as any).env.DB.prepare('DELETE FROM messages WHERE room_token = ?').bind(token).run();
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(JSON.stringify({ error: '无效请求' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
}

async function handleToggleRoom(request: Request): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!await validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json() as any;
  if (!body || !body.token) {
    return new Response(JSON.stringify({ error: '缺少 token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const room = await (globalThis as any).env.DB.prepare('SELECT * FROM rooms WHERE token = ?').bind(body.token).first() as any;
  if (!room) {
    return new Response(JSON.stringify({ error: '房间不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const newDisabled = room.disabled ? 0 : 1;
  await (globalThis as any).env.DB.prepare('UPDATE rooms SET disabled = ? WHERE token = ?').bind(newDisabled, body.token).run();

  return new Response(JSON.stringify({ ok: true, disabled: newDisabled }), { headers: { 'Content-Type': 'application/json' } });
}

// --- Main Handler ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    (globalThis as any).env = env;

    // Auto-initialize D1 tables
    try {
      await env.DB.exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_token TEXT NOT NULL, content TEXT NOT NULL, msg_type TEXT NOT NULL DEFAULT \'text\', filename TEXT, created_at TEXT NOT NULL)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_token, id)');
      await env.DB.exec('CREATE TABLE IF NOT EXISTS rooms (token TEXT PRIMARY KEY, name TEXT NOT NULL, ttl_minutes INTEGER NOT NULL DEFAULT 30, created_at TEXT NOT NULL, expires_at TEXT, disabled INTEGER NOT NULL DEFAULT 0)');
      // 兼容旧表：已存在但缺少 expires_at 列时补充
      try { await env.DB.exec("ALTER TABLE rooms ADD COLUMN expires_at TEXT"); } catch (e: any) {}
      await env.DB.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
      await env.DB.exec('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, created_at TEXT NOT NULL)');
      await env.DB.exec('CREATE TABLE IF NOT EXISTS rate_limits (ip TEXT PRIMARY KEY, count INTEGER NOT NULL, first_attempt_at TEXT NOT NULL, blocked_until TEXT)');
    } catch (e: any) {
      console.error('D1 init failed:', e.message);
    }

    // 首次部署：初始化管理员密码为 admin
    {
      const storedHash = await getSetting('admin_password');
      if (!storedHash) {
        await setSetting('admin_password', await hashPassword('admin'));
      }
    }

    await cleanupExpiredSessions();

    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      });
    }

    // --- WebSocket Upgrade ---
    const isWsPath = path === '/ws' || path.startsWith('/ws?') || path === '/' || path.startsWith('/?');
    if (isWsPath && request.headers.get('Upgrade') === 'websocket') {
      const token = url.searchParams.get('token');
      if (!token) {
        return new Response('Missing token', { status: 400 });
      }

      const id = env.ROOM.idFromName(token);
      const stub = env.ROOM.get(id);

      return stub.fetch(request);
    }

    // --- API Routes ---
    if (path === '/api/config') {
      const domain = await getSetting('domain') || '';
      return new Response(JSON.stringify({
        defaultToken: env.DEFAULT_TOKEN || 'clip-relay',
        maxImageSize: parseInt(env.MAX_IMAGE_SIZE || '5242880'),
        domain,
        lanIP: ''
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (path === '/api/admin/login' && request.method === 'POST') {
      return handleLogin(request, env);
    }

    if (path === '/api/admin/change-password' && request.method === 'POST') {
      return handleChangePassword(request, env);
    }

    // Protected routes check
    const auth = request.headers.get('Authorization') || '';
    const isAuthenticated = validateSession(auth);

    if (path.startsWith('/api/admin/') && !path.includes('/login') && !path.includes('/change-password')) {
      if (!isAuthenticated) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
    }

    if (path === '/api/admin/rooms' && request.method === 'GET') {
      return handleGetRooms();
    }

    if (path === '/api/admin/rooms' && request.method === 'POST') {
      return handleCreateRoom(request);
    }

    if (path.startsWith('/api/admin/rooms/') && request.method === 'DELETE') {
      return handleDeleteRoom(url, request);
    }

    if (path === '/api/admin/rooms/toggle' && request.method === 'POST') {
      return handleToggleRoom(request);
    }

    if (path === '/api/admin/domain' && request.method === 'POST') {
      const auth = request.headers.get('Authorization') || '';
      if (!await validateSession(auth)) {
        return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      const body = await request.json() as any;
      if (!body || typeof body.domain !== 'string') {
        return new Response(JSON.stringify({ error: '缺少域名参数' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const domain = body.domain.trim();
      await setSetting('domain', domain);
      return new Response(JSON.stringify({ ok: true, domain }), { headers: { 'Content-Type': 'application/json' } });
    }

    // Serve frontend pages
    if (path === '/admin') {
      return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss:" } });
    }

    // Root without token → redirect to admin
    if ((path === '/' || path === '/index.html') && !url.searchParams.has('token')) {
      return Response.redirect(`${url.origin}/admin`, 302);
    }

    return new Response(INDEX_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' wss:" } });
  }
};

export { Room };