import { D1Database } from '@cloudflare/workers-types';

let db: D1Database | null = null;

export function initStorage(d1: D1Database) {
  db = d1;
}

export function getDb(): D1Database {
  if (!db) throw new Error('Storage not initialized');
  return db;
}

export async function initDB(): Promise<void> {
  const d = getDb();

  await d.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_token TEXT NOT NULL,
      content TEXT NOT NULL,
      msg_type TEXT NOT NULL DEFAULT 'text',
      filename TEXT,
      created_at TEXT NOT NULL
    )
  `);

  await d.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_token, id)
  `);

  await d.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      token TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ttl_minutes INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL,
      disabled INTEGER NOT NULL DEFAULT 0
    )
  `);

  await d.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

export function addMessage(roomToken: string, content: string) {
  const d = getDb();
  const createdAt = new Date().toISOString();
  const result = d.prepare(
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

export function addImageMessage(roomToken: string, content: string, filename: string) {
  const d = getDb();
  const createdAt = new Date().toISOString();
  const result = d.prepare(
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

export function getRoomMessages(roomToken: string, limit = 100) {
  const d = getDb();
  const rows = d.prepare(
    'SELECT * FROM messages WHERE room_token = ? ORDER BY id DESC LIMIT ?'
  ).all(roomToken, limit);
  return (rows.results || []).reverse();
}

export function deleteRoomMessages(roomToken: string) {
  const d = getDb();
  d.prepare('DELETE FROM messages WHERE room_token = ?').run(roomToken);
}

export function cleanupOldMessages(ttlMinutes: number) {
  if (ttlMinutes <= 0) return;
  const d = getDb();
  const cutoff = new Date(Date.now() - ttlMinutes * 60 * 1000).toISOString();
  d.prepare(`DELETE FROM messages WHERE created_at < ?`).run(cutoff);
}

export function createRoom(token: string, name: string, ttlMinutes: number) {
  const d = getDb();
  const createdAt = new Date().toISOString();
  d.prepare(`
    INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, disabled)
    VALUES (?, ?, ?, ?, 0)
  `).run(token, name, ttlMinutes, createdAt);

  return { token, name, ttl_minutes: ttlMinutes, created_at: createdAt, disabled: 0 };
}

export function getRoomConfig(token: string) {
  const d = getDb();
  return d.prepare('SELECT * FROM rooms WHERE token = ?').get(token) as any;
}

export function listRooms() {
  const d = getDb();
  return d.prepare('SELECT * FROM rooms ORDER BY created_at DESC').all().results || [];
}

export function deleteRoom(token: string) {
  const d = getDb();
  d.prepare('DELETE FROM rooms WHERE token = ?').run(token);
  d.prepare('DELETE FROM messages WHERE room_token = ?').run(token);
}

export function toggleRoom(token: string) {
  const d = getDb();
  const room = getRoomConfig(token);
  if (!room) return null;
  const newDisabled = room.disabled ? 0 : 1;
  d.prepare('UPDATE rooms SET disabled = ? WHERE token = ?').run(newDisabled, token);
  return newDisabled;
}

export function countRoomMessages(token: string) {
  const d = getDb();
  const row = d.prepare('SELECT COUNT(*) as count FROM messages WHERE room_token = ?').get(token) as any;
  return row?.count || 0;
}

export function getSetting(key: string): string | null {
  const d = getDb();
  const row = d.prepare('SELECT value FROM settings WHERE key = ?').get(key) as any;
  return row?.value || null;
}

export function setSetting(key: string, value: string) {
  const d = getDb();
  d.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value);
}

export function initDefaultAdmin() {
  const existing = getSetting('admin_password');
  if (!existing) {
    const { createHash } = require('crypto');
    const hash = createHash('sha256').update('admin').digest('hex');
    setSetting('admin_password', hash);
  }
}