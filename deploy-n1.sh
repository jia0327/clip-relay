#!/bin/sh
# ClipRelay N1 / OpenWRT 一键部署脚本
# 用法：先修改下方的配置变量，然后执行
#   chmod +x deploy-n1.sh && ./deploy-n1.sh
set -e

# ==========================================
# 配置区 — 根据你的环境修改以下变量
# ==========================================

# 项目目录
CLIPRELAY_DIR=/opt/clip-relay

# Docker 网络 — cloudflared 所在的网络名
# 查看命令: docker inspect cloudflared | grep -A5 Networks
CLOUDFLARED_NETWORK=gotify-internal

# Cloudflare Tunnel ID（创建隧道时生成）
TUNNEL_ID=your-tunnel-id-here

# 要绑定的域名（已在 Cloudflare DNS 托管）
DOMAIN=relay.yourdomain.com

# cloudflared 配置文件路径
CLOUDFLARED_CONFIG=/mnt/mmc1-4/cloudflared/config.yml

# cloudflared 容器名
CLOUDFLARED_CONTAINER=cloudflared

# ==========================================
# 部署流程
# ==========================================

echo "=========================================="
echo " ClipRelay N1 部署脚本"
echo "=========================================="

# 检查项目目录
if [ ! -d "$CLIPRELAY_DIR" ]; then
  echo "错误: $CLIPRELAY_DIR 不存在，请先复制项目文件"
  exit 1
fi

# 1. 写入 docker-compose.yml
echo ""
echo "=== 1. 写入 docker-compose.yml ==="
cat > "$CLIPRELAY_DIR/docker-compose.yml" << COMPOSEEOF
services:
  clip-relay:
    build:
      context: .
      network: host
    networks:
      - ${CLOUDFLARED_NETWORK}
    volumes:
      - clip-relay-data:/app/data
    restart: unless-stopped
    environment:
      - PORT=3000
      - NODE_ENV=production

networks:
  ${CLOUDFLARED_NETWORK}:
    external: true

volumes:
  clip-relay-data:
COMPOSEEOF
echo "  docker-compose.yml 已写入（网络: $CLOUDFLARED_NETWORK）"

# 2. 构建镜像
echo ""
echo "=== 2. 构建 ClipRelay 镜像 ==="
echo "  使用 --network host 绕过 DNS 拦截..."
cd "$CLIPRELAY_DIR"
docker compose build --network host 2>&1 | tail -3
echo "  构建完成"

# 3. 更新 cloudflared 配置（如需要）
echo ""
echo "=== 3. 更新 cloudflared 配置 ==="
if [ -f "$CLOUDFLARED_CONFIG" ]; then
  cp "$CLOUDFLARED_CONFIG" "$CLOUDFLARED_CONFIG.bak.$(date +%Y%m%d%H%M%S)"
  echo "  已备份旧配置 → $CLOUDFLARED_CONFIG.bak.*"
fi

cat > "$CLOUDFLARED_CONFIG" << CONFEOF
tunnel: ${TUNNEL_ID}
credentials-file: /home/nonroot/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: ${DOMAIN}
    service: http://clip-relay:3000
  - service: http_status:404
CONFEOF
echo "  cloudflared 配置已写入（域名: $DOMAIN）"

# 4. 启动 ClipRelay
echo ""
echo "=== 4. 启动 ClipRelay ==="
cd "$CLIPRELAY_DIR"
docker compose up -d --no-build 2>&1
echo "  容器已启动"

# 5. 配置 DNS 记录
echo ""
echo "=== 5. 配置 DNS 记录 ==="
docker exec "$CLOUDFLARED_CONTAINER" cloudflared tunnel route dns "$TUNNEL_ID" "$DOMAIN" 2>&1
echo "  DNS 已配置"

# 6. 重启 cloudflared
echo ""
echo "=== 6. 重启 cloudflared ==="
docker restart "$CLOUDFLARED_CONTAINER"
sleep 2

# 7. 获取管理员密码
echo ""
echo "=== 7. 管理员密码 ==="
docker compose logs clip-relay 2>/dev/null | grep "管理员密码" | tail -1
echo ""

echo "=========================================="
echo " 部署完成"
echo "=========================================="
echo "后台地址: https://$DOMAIN/admin"
echo ""
echo "常用命令:"
echo "  查看日志: docker compose -f $CLIPRELAY_DIR/docker-compose.yml logs -f"
echo "  重启:     docker compose -f $CLIPRELAY_DIR/docker-compose.yml restart"
echo "  停止:     docker compose -f $CLIPRELAY_DIR/docker-compose.yml down"
echo ""
