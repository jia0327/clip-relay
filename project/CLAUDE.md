# ClipRelay 工程规范

## 项目概述

ClipRelay：基于 WebSocket + SQLite (sql.js) 的临时剪贴板中继系统。Token 房间制，无账号，30 分钟 TTL（可设为永久）。

## 核心文件

| 目录 | 文件 | 职责 |
|------|------|------|
| `src/` | `server.js` | HTTP 服务/WebSocket/认证/限流/API 路由 |
| `src/` | `room.js` | RoomManager：房间生命周期/连接管理/广播（纯内存） |
| `src/` | `db.js` | SQLite 操作：消息 CRUD/房间配置/settings 表 |
| `public/` | `index.html` | 客户端单页（原生 JS + CSS） |
| `public/` | `admin.html` | 管理后台单页 |
| `config/` | `config.json` | 运行时配置 |

## 关键约束

- **数据库**：sql.js (WASM)，路径 `data/clip-relay.db`，每次写操作立即 `persistDB()`
- **房间 TTL**：默认 30 分钟，`ttl_minutes=0` 表示永久
- **认证**：Bearer token (24h TTL)，登录限流（同 IP 1 分钟 5 次，超出封禁 5 分钟）
- **密码**：SHA256 哈希存 DB，`config/config.json` 明文备份
- **前端交互**：点击消息复制全部，拖选复制部分，无自动复制

## 启动

```bash
npm install && npm start  # 服务启动后打印管理员密码
```

## 架构流

```
Client WS → src/server.js:handleConnection
           → src/db.js:getRoomConfig() 检查 disabled
           → src/room.js:RoomManager.getOrCreate() 内存管理
           → src/db.js:addMessage() → persistDB() 持久化
           → src/room.js:broadcast() 推送给同房间其他连接
```

## 部署注意

- N1/OpenWRT：Docker 构建需 `--network host`（DNS 拦截问题）
- 生产：通过 cloudflared 代理，不暴露 3000 端口
- 中文 Token：`DELETE /api/admin/rooms/:token` 需 `decodeURIComponent()`

## 禁止事项

- 禁止提交密钥/凭证到代码库
- 禁止 eval 未知代码
- 禁止盲目高频请求