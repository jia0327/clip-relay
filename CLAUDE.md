# CLAUDE.md

本项目使用长期 AI 工程上下文架构，详见 `project/` 目录。

## 快速入口

| 文件 | 作用 |
|------|------|
| `project/CLAUDE.md` | 工程规范（Token/Cache/安全规则） |
| `project/repo_map.md` | 项目结构摘要 |
| `project/architecture.md` | 系统架构图 |
| `project/current_task.md` | 当前任务上下文 |

## 项目概述

ClipRelay：基于时间窗口的剪贴板中继系统。WebSocket + SQLite (sql.js)，Token 房间制，无账号。

## 启动

```bash
npm install && npm start
```

访问 `http://localhost:3000/admin` 进入后台（首次启动打印管理员密码）。