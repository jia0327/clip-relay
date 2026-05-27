// Cloudflare Workers: D1 持久化的登录限流

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_BLOCK = 300000;

function getDB() {
  return (globalThis as any).env.DB;
}

export async function checkRateLimit(ip: string): Promise<{ blocked: boolean; remainingSeconds?: number; remaining?: number; message?: string }> {
  const now = Date.now();
  const row = await getDB().prepare('SELECT count, first_attempt_at, blocked_until FROM rate_limits WHERE ip = ?').bind(ip).first() as any;

  let count = 0;
  let firstAttemptAt = now;
  let blockedUntil = 0;

  if (row) {
    count = row.count;
    firstAttemptAt = new Date(row.first_attempt_at).getTime();
    blockedUntil = row.blocked_until ? new Date(row.blocked_until).getTime() : 0;
  }

  if (blockedUntil > now) {
    return { blocked: true, remainingSeconds: Math.ceil((blockedUntil - now) / 1000) };
  }

  if (now - firstAttemptAt > RATE_LIMIT_WINDOW) {
    count = 0;
    firstAttemptAt = now;
  }

  count++;
  const newBlockedUntil = count > RATE_LIMIT_MAX ? now + RATE_LIMIT_BLOCK : 0;
  const newFirstAttemptAt = count === 1 ? now : firstAttemptAt;

  if (newBlockedUntil) {
    await getDB().prepare(
      'INSERT OR REPLACE INTO rate_limits (ip, count, first_attempt_at, blocked_until) VALUES (?, ?, ?, ?)'
    ).bind(ip, count, new Date(newFirstAttemptAt).toISOString(), new Date(newBlockedUntil).toISOString()).run();
    return { blocked: true, remainingSeconds: Math.ceil(RATE_LIMIT_BLOCK / 1000), message: `尝试次数过多，请${Math.ceil(RATE_LIMIT_BLOCK / 1000)}秒后再试` };
  }

  await getDB().prepare(
    'INSERT OR REPLACE INTO rate_limits (ip, count, first_attempt_at, blocked_until) VALUES (?, ?, ?, NULL)'
  ).bind(ip, count, new Date(newFirstAttemptAt).toISOString()).run();

  return { blocked: false, remaining: RATE_LIMIT_MAX - count };
}

export async function clearRateLimit(ip: string): Promise<void> {
  await getDB().prepare('DELETE FROM rate_limits WHERE ip = ?').bind(ip).run();
}
