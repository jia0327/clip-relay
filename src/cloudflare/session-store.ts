// Cloudflare Workers: D1 持久化的 session 管理

const SESSION_TTL = 24 * 60 * 60 * 1000;

function getDB() {
  return (globalThis as any).env.DB;
}

export function createSession(): string {
  const token = Date.now().toString(36) + crypto.randomUUID().substring(0, 8);
  const now = new Date().toISOString();
  getDB().prepare('INSERT INTO sessions (token, created_at) VALUES (?, ?)').bind(token, now).run();
  return token;
}

export async function validateSession(auth: string): Promise<boolean> {
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const row = await getDB().prepare('SELECT created_at FROM sessions WHERE token = ?').bind(token).first() as any;
  if (!row) return false;
  const created = new Date(row.created_at).getTime();
  if (Date.now() - created > SESSION_TTL) {
    await getDB().prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
    return false;
  }
  return true;
}

export async function cleanupExpiredSessions(): Promise<void> {
  const cutoff = new Date(Date.now() - SESSION_TTL).toISOString();
  await getDB().prepare('DELETE FROM sessions WHERE created_at < ?').bind(cutoff).run();
}
