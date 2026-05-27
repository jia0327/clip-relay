// Token 生成（运行时无关）
function generateToken(prefix) {
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

module.exports = { generateToken };
