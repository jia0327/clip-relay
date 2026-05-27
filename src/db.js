const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data', 'clip-relay.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_token TEXT NOT NULL,
      content TEXT NOT NULL,
      msg_type TEXT NOT NULL DEFAULT 'text',
      filename TEXT,
      created_at TEXT NOT NULL
    )
  `);
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_token, id)');

  db.run(`
    CREATE TABLE IF NOT EXISTS rooms (
      token TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ttl_minutes INTEGER NOT NULL DEFAULT 30,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      disabled INTEGER NOT NULL DEFAULT 0
    )
  `);

  migrateColumns();
  doPersist();
  return db;
}

function migrateColumns() {
  try { db.run('ALTER TABLE messages ADD COLUMN msg_type TEXT NOT NULL DEFAULT \'text\''); } catch (_) {}
  try { db.run('ALTER TABLE messages ADD COLUMN filename TEXT'); } catch (_) {}
  try { db.run('CREATE TABLE IF NOT EXISTS rooms (token TEXT PRIMARY KEY, name TEXT NOT NULL, ttl_minutes INTEGER NOT NULL DEFAULT 30, created_at TEXT NOT NULL)'); } catch (_) {}
  try { db.run('ALTER TABLE rooms ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
  try { db.run('ALTER TABLE rooms ADD COLUMN expires_at TEXT'); } catch (_) {}
  doPersist();
}

let persistTimer = null;
const PERSIST_DEBOUNCE_MS = 1000;

function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    doPersist();
    persistTimer = null;
  }, PERSIST_DEBOUNCE_MS);
}

function doPersist() {
  const data = db.export();
  const tmpPath = DB_PATH + '.tmp';
  fs.writeFileSync(tmpPath, Buffer.from(data));
  fs.renameSync(tmpPath, DB_PATH);
}

function flushDB() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  doPersist();
}

function persistDB() {
  schedulePersist();
}

// --- 消息 ---
function addMessage(roomToken, content) {
  const now = new Date().toISOString();
  db.run('INSERT INTO messages (room_token, content, msg_type, created_at) VALUES (?, ?, \'text\', ?)',
    [roomToken, content, now]);
  persistDB();
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0];
  return { id, room_token: roomToken, content, msg_type: 'text', created_at: now };
}

function addImageMessage(roomToken, content, filename) {
  const now = new Date().toISOString();
  db.run('INSERT INTO messages (room_token, content, msg_type, filename, created_at) VALUES (?, ?, \'image\', ?, ?)',
    [roomToken, content, filename || 'image.png', now]);
  persistDB();
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0];
  return { id, room_token: roomToken, content, msg_type: 'image', filename, created_at: now };
}

function getRoomMessages(roomToken) {
  const stmt = db.prepare(
    'SELECT id, content, msg_type, filename, created_at FROM messages WHERE room_token = ? ORDER BY id ASC'
  );
  stmt.bind([roomToken]);
  const messages = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    if (row.filename === null) delete row.filename;
    messages.push(row);
  }
  stmt.free();
  return messages;
}

function deleteRoomMessages(roomToken) {
  db.run('DELETE FROM messages WHERE room_token = ?', [roomToken]);
  persistDB();
}

function cleanupOldMessages() {
  const now = new Date().toISOString();
  // 优先用 expires_at 精确判断过期房间
  db.run(`DELETE FROM messages WHERE room_token IN (SELECT token FROM rooms WHERE expires_at IS NOT NULL AND expires_at < ?)`, [now]);
  // fallback: 没有 expires_at 的旧房间用 created_at + ttl_minutes 推算
  db.run(`DELETE FROM messages WHERE room_token IN (SELECT token FROM rooms WHERE expires_at IS NULL AND ttl_minutes > 0 AND datetime(created_at, '+' || ttl_minutes || ' minutes') < ?)`, [now]);
  persistDB();
}

// --- 房间管理 ---
function createRoom(token, name, ttlMinutes) {
  const now = new Date().toISOString();
  const expiresAt = ttlMinutes > 0 ? new Date(Date.now() + ttlMinutes * 60000).toISOString() : null;
  db.run('INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at, expires_at) VALUES (?, ?, ?, ?, ?)',
    [token, name, ttlMinutes, now, expiresAt]);
  persistDB();
  return { token, name, ttl_minutes: ttlMinutes, created_at: now, expires_at: expiresAt };
}

function getRoomConfig(token) {
  const stmt = db.prepare('SELECT token, name, ttl_minutes, created_at, expires_at, disabled FROM rooms WHERE token = ?');
  stmt.bind([token]);
  let room = null;
  if (stmt.step()) room = stmt.getAsObject();
  stmt.free();
  return room;
}

function toggleRoom(token) {
  const stmt = db.prepare('SELECT disabled FROM rooms WHERE token = ?');
  stmt.bind([token]);
  let current = 0;
  if (stmt.step()) current = stmt.getAsObject().disabled;
  stmt.free();
  const newVal = current ? 0 : 1;
  db.run('UPDATE rooms SET disabled = ? WHERE token = ?', [newVal, token]);
  persistDB();
  return newVal;
}

function listRooms() {
  const stmt = db.prepare('SELECT token, name, ttl_minutes, created_at, expires_at, disabled FROM rooms ORDER BY created_at DESC');
  const rooms = [];
  while (stmt.step()) rooms.push(stmt.getAsObject());
  stmt.free();
  return rooms;
}

function deleteExpiredRooms() {
  const now = new Date().toISOString();
  const stmt = db.prepare("SELECT token FROM rooms WHERE expires_at IS NOT NULL AND expires_at < ?");
  stmt.bind([now]);
  const expired = [];
  while (stmt.step()) expired.push(stmt.getAsObject().token);
  stmt.free();
  for (const token of expired) deleteRoom(token);
  return expired.length;
}

function deleteRoom(token) {
  db.run('BEGIN');
  try {
    db.run('DELETE FROM messages WHERE room_token = ?', [token]);
    db.run('DELETE FROM rooms WHERE token = ?', [token]);
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  persistDB();
}

function countRoomMessages(token) {
  const stmt = db.prepare('SELECT COUNT(*) as c FROM messages WHERE room_token = ?');
  stmt.bind([token]);
  let count = 0;
  if (stmt.step()) count = stmt.getAsObject().c;
  stmt.free();
  return count;
}

// --- 管理员账号 ---
function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  stmt.bind([key]);
  let val = null;
  if (stmt.step()) val = stmt.getAsObject().value;
  stmt.free();
  return val;
}

function setSetting(key, value) {
  db.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
  persistDB();
}

function initDefaultAdmin() {
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`);
  const existing = getSetting('admin_password');
  if (!existing) {
    // 默认密码 admin，SHA256 哈希
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update('admin').digest('hex');
    setSetting('admin_password', hash);
  }
}

module.exports = {
  initDB,
  addMessage, addImageMessage, getRoomMessages, deleteRoomMessages, cleanupOldMessages,
  createRoom, getRoomConfig, listRooms, deleteRoom, deleteExpiredRooms, countRoomMessages,
  toggleRoom,
  getSetting, setSetting, initDefaultAdmin,
  flushDB
};
