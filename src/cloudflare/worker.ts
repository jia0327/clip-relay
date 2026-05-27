import type { DurableObjectNamespace, D1Database } from '@cloudflare/workers-types';
import { Room } from './room';
import { INDEX_HTML, ADMIN_HTML } from './static_pages';

export interface Env {
  DB: D1Database;
  ROOM: DurableObjectNamespace;
  MAX_IMAGE_SIZE: string;
  DEFAULT_TOKEN: string;
  ADMIN_PASSWORD?: string;
}

// --- Session 管理 ---
const sessions = new Map<string, { createdAt: number }>();
const SESSION_TTL = 24 * 60 * 60 * 1000;

function createSession(): string {
  const token = crypto.randomUUID();
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function validateSession(auth: string): boolean {
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token)!;
  if (Date.now() - s.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function hashPassword(pw: string): string {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw))
    .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''));
}

// --- Rate Limiting ---
const rateLimitMap = new Map<string, { count: number; firstAttempt: number; blockedUntil: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_BLOCK = 300000;

function checkRateLimit(ip: string): { blocked: boolean; remaining?: number; remainingSeconds?: number; message?: string } {
  const now = Date.now();
  let entry = rateLimitMap.get(ip);
  if (!entry) {
    entry = { count: 0, firstAttempt: now, blockedUntil: 0 };
    rateLimitMap.set(ip, entry);
  }
  if (entry.blockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((entry.blockedUntil - now) / 1000) };
  }
  if (now - entry.firstAttempt > RATE_LIMIT_WINDOW) {
    entry.count = 0;
    entry.firstAttempt = now;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) {
    entry.blockedUntil = now + RATE_LIMIT_BLOCK;
    const remainSec = Math.ceil(RATE_LIMIT_BLOCK / 1000);
    return { blocked: true, remainingSeconds: remainSec, message: `尝试次数过多，请${remainSec}秒后再试` };
  }
  return { blocked: false, remaining: RATE_LIMIT_MAX - entry.count };
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
  const limit = checkRateLimit(ip);
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
    rateLimitMap.delete(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 恢复密码
  if (env.ADMIN_PASSWORD && body.password === env.ADMIN_PASSWORD) {
    await setSetting('admin_password', inputHash);
    rateLimitMap.delete(ip);
    const sessionToken = createSession();
    return new Response(JSON.stringify({ token: sessionToken, recovered: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const hint = (limit as any).remaining <= 1 ? '，忘记密码请重置' : '';
  return new Response(JSON.stringify({ error: `密码错误，还剩${(limit as any).remaining}次尝试${hint}` }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json() as any;
  if (!body || !body.oldPassword || !body.newPassword) {
    return new Response(JSON.stringify({ error: '缺少参数' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const storedHash = await getSetting('admin_password');
  const oldInputHash = await hashPassword(body.oldPassword);

  // 允许用恢复密码作为原密码
  if (oldInputHash !== storedHash && !(env.ADMIN_PASSWORD && body.oldPassword === env.ADMIN_PASSWORD)) {
    return new Response(JSON.stringify({ error: '原密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const newHash = await hashPassword(body.newPassword);
  await setSetting('admin_password', newHash);

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
}

async function handleGetRooms(): Promise<Response> {
  const db = (globalThis as any).env.DB;
  const { results: rooms } = await db.prepare('SELECT * FROM rooms ORDER BY created_at DESC').all();

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
  if (!validateSession(auth)) {
    return new Response(JSON.stringify({ error: '未登录' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const body = await request.json() as any;
  if (!body || !body.name) {
    return new Response(JSON.stringify({ error: '缺少房间名称' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const token = body.token || generateToken(body.name);
  const ttl = body.ttl_minutes !== undefined ? body.ttl_minutes : 30;
  const createdAt = new Date().toISOString();

  await (globalThis as any).env.DB.prepare(`
    INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, disabled)
    VALUES (?, ?, ?, ?, 0)
  `).bind(token, body.name, ttl, createdAt).run();

  return new Response(JSON.stringify({ token, name: body.name, ttl_minutes: ttl, created_at: createdAt, disabled: 0 }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleDeleteRoom(url: URL, request: Request): Promise<Response> {
  const auth = request.headers.get('Authorization') || '';
  if (!validateSession(auth)) {
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
  if (!validateSession(auth)) {
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

function generateToken(prefix?: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  if (prefix) {
    const clean = prefix.replace(/[^a-zA-Z0-9一-龥]/g, '').replace(/\s+/g, '-').substring(0, 20);
    return clean + '-' + result;
  }
  return result.slice(0, 4) + '-' + result.slice(4, 8) + '-' + result.slice(8, 12);
}

// --- Main Handler ---
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    (globalThis as any).env = env;

    // Auto-initialize D1 tables
    try {
      await env.DB.exec('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room_token TEXT NOT NULL, content TEXT NOT NULL, msg_type TEXT NOT NULL DEFAULT \'text\', filename TEXT, created_at TEXT NOT NULL)');
      await env.DB.exec('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_token, id)');
      await env.DB.exec('CREATE TABLE IF NOT EXISTS rooms (token TEXT PRIMARY KEY, name TEXT NOT NULL, ttl_minutes INTEGER NOT NULL DEFAULT 30, created_at TEXT NOT NULL, disabled INTEGER NOT NULL DEFAULT 0)');
      await env.DB.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    } catch (e: any) {
      console.error('D1 init failed:', e.message);
    }

    // Sync admin password from env var
    {
      const adminPwd = env.ADMIN_PASSWORD || 'admin';
      const adminHash = await hashPassword(adminPwd);
      const storedHash = await getSetting('admin_password');
      if (adminHash !== storedHash) {
        await setSetting('admin_password', adminHash);
      }
    }

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
      if (!validateSession(auth)) {
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
      return new Response(ADMIN_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }

    // Root without token → redirect to admin
    if ((path === '/' || path === '/index.html') && !url.searchParams.has('token')) {
      return Response.redirect(`${url.origin}/admin`, 302);
    }

    return new Response(INDEX_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }
};

export { Room };