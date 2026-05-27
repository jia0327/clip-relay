# 项目结构

```
clip-relay/
├── src/                   # 核心代码
│   ├── server.js          # 主入口：HTTP + WebSocket + API
│   ├── room.js            # RoomManager：内存房间管理
│   └── db.js              # SQLite (sql.js) 操作层
├── public/                # 前端资源
│   ├── index.html         # 客户端 UI
│   └── admin.html         # 管理后台 UI
├── data/                  # SQLite DB 文件
├── config/                # 配置文件
│   └── config.json
├── deploy/                # 部署文件
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── deploy-n1.sh
├── docs/                  # 文档
│   ├── README.md
│   ├── 本地部署教程.md
│   └── 部署指南.md
├── project/               # AI 工程上下文
│   ├── CLAUDE.md          # 工程规范
│   ├── repo_map.md        # 本文件
│   ├── architecture.md    # 架构图
│   ├── current_task.md    # 动态任务
│   ├── evidence/          # 调试证据
│   ├── memory/            # 长期经验
│   └── docs/              # 额外文档
└── package.json
```

## 核心模块

### src/server.js (592 行)
- HTTP 服务 (`http.createServer`)
- WebSocket 服务 (`ws.Server`)
- API 路由 (`/api/admin/*`, `/api/config`)
- 认证：`validateSession()` / `checkRateLimit()`
- 配置加载：`config/config.json`

### src/room.js (126 行)
- `RoomManager` 类：`rooms` Map 存内存状态
- 核心方法：`getOrCreate` / `addConnection` / `broadcast` / `cleanupExpired`
- TTL 逻辑：`isExpired()` / `getExpiresIn()`

### src/db.js (196 行)
- `initSqlJs()` 初始化 WASM
- 表：`messages` / `rooms` / `settings`
- 每次写操作后 `persistDB()` 落地

### public/
- 全原生实现，无框架
- 消息气泡：微信风格（绿右蓝左，非对称圆角）
- 主题：跟随系统 + localStorage 持久化