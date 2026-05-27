// 登录限流（运行时无关）
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW = 60000;
const RATE_LIMIT_BLOCK = 300000;

function checkRateLimit(ip) {
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
    return { blocked: true, remainingSeconds: Math.ceil(RATE_LIMIT_BLOCK / 1000), message: `尝试次数过多，请${Math.ceil(RATE_LIMIT_BLOCK / 1000)}秒后再试` };
  }
  return { blocked: false, remaining: RATE_LIMIT_MAX - entry.count };
}

function clearRateLimit(ip) {
  rateLimitMap.delete(ip);
}

module.exports = { checkRateLimit, clearRateLimit };
