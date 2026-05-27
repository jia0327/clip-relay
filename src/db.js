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
      created_at TEXT NOT NULL
    )
  `);

  migrateColumns();
  persistDB();
  return db;
}

function migrateColumns() {
  try { db.run('ALTER TABLE messages ADD COLUMN msg_type TEXT NOT NULL DEFAULT \'text\''); } catch (_) {}
  try { db.run('ALTER TABLE messages ADD COLUMN filename TEXT'); } catch (_) {}
  try { db.run('CREATE TABLE IF NOT EXISTS rooms (token TEXT PRIMARY KEY, name TEXT NOT NULL, ttl_minutes INTEGER NOT NULL DEFAULT 30, created_at TEXT NOT NULL)'); } catch (_) {}
  try { db.run('ALTER TABLE rooms ADD COLUMN disabled INTEGER NOT NULL DEFAULT 0'); } catch (_) {}
  persistDB();
}

function persistDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
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
  // 删除所有非永久房间的过期消息
  const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  db.run(`DELETE FROM messages WHERE room_token NOT IN (SELECT token FROM rooms WHERE ttl_minutes = 0) AND created_at < ?`, [cutoff]);
  persistDB();
}

// --- 房间管理 ---
function createRoom(token, name, ttlMinutes) {
  const now = new Date().toISOString();
  db.run('INSERT OR REPLACE INTO rooms (token, name, ttl_minutes, created_at) VALUES (?, ?, ?, ?)',
    [token, name, ttlMinutes, now]);
  persistDB();
  return { token, name, ttl_minutes: ttlMinutes, created_at: now };
}

function getRoomConfig(token) {
  const stmt = db.prepare('SELECT token, name, ttl_minutes, created_at, disabled FROM rooms WHERE token = ?');
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
  const stmt = db.prepare('SELECT token, name, ttl_minutes, created_at, disabled FROM rooms ORDER BY created_at DESC');
  const rooms = [];
  while (stmt.step()) rooms.push(stmt.getAsObject());
  stmt.free();
  return rooms;
}

function deleteRoom(token) {
  db.run('DELETE FROM rooms WHERE token = ?', [token]);
  db.run('DELETE FROM messages WHERE room_token = ?', [token]);
  persistDB();
}

function countRoomMessages(token) {
  const result = db.exec('SELECT COUNT(*) as c FROM messages WHERE room_token = ?', [token]);
  // sql.js exec with params doesn't work like this, use prepare
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
  createRoom, getRoomConfig, listRooms, deleteRoom, countRoomMessages,
  toggleRoom,
  getSetting, setSetting, initDefaultAdmin
};
