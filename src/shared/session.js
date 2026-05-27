// Session 管理（运行时无关）
const sessions = new Map();
const SESSION_TTL = 24 * 60 * 60 * 1000;

function createSession() {
  const token = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
  sessions.set(token, { createdAt: Date.now() });
  return token;
}

function validateSession(auth) {
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token || !sessions.has(token)) return false;
  const s = sessions.get(token);
  if (Date.now() - s.createdAt > SESSION_TTL) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now - s.createdAt > SESSION_TTL) sessions.delete(token);
  }
}

module.exports = { createSession, validateSession, cleanupExpiredSessions };
