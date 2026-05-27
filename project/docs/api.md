# API Reference

## WebSocket API

### 连接
```
ws://host:port/?token={room_token}
```

### 客户端 → 服务端

| 类型 | 格式 | 说明 |
|------|------|------|
| join | `{ "type": "join", "device_type": "desktop\|mobile" }` | 加入房间 |
| message | `{ "type": "message", "content": "text" }` | 发送文本 |
| image | `{ "type": "image", "content": "data:image/...", "filename": "xxx.png" }` | 发送图片 |
| ping | `{ "type": "ping" }` | 心跳 |
| clear_messages | `{ "type": "clear_messages" }` | 清除历史消息 |

### 服务端 → 客户端

| 类型 | 格式 | 说明 |
|------|------|------|
| joined | `{ "type": "joined", messages: [], room_name, expires_in, online_count, ... }` | 加入成功 |
| message | `{ "type": "message", message: {...} }` | 收到文本消息 |
| image | `{ "type": "image", message: {...} }` | 收到图片消息 |
| device_joined | `{ "type": "device_joined", device_type }` | 设备加入通知 |
| device_left | `{ "type": "device_left", device_type }` | 设备离开通知 |
| room_expired | `{ "type": "room_expired" }` | 房间已过期 |
| messages_cleared | `{ "type": "messages_cleared" }` | 消息已清除 |
| error | `{ "type": "error", message: "..." }` | 错误 |

## HTTP API

### 公开接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/config` | 获取配置（defaultToken, maxImageSize, domain, lanIP） |
| GET | `/` | 首页，无 token 跳转 /admin |
| GET | `/admin` | 管理后台 |

### 认证接口

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| POST | `/api/admin/login` | `{ "password": "xxx" }` | 登录，返回 `{ "token": "session_token" }` |

### 管理接口（需认证）

| 方法 | 路径 | 参数 | 说明 |
|------|------|------|------|
| GET | `/api/admin/rooms` | - | 房间列表 |
| POST | `/api/admin/rooms` | `{ "name": "xxx", "token": "optional", "ttl_minutes": 30 }` | 创建房间 |
| DELETE | `/api/admin/rooms/:token` | - | 删除房间（需 decodeURIComponent） |
| DELETE | `/api/admin/rooms/:token/messages` | - | 清空房间消息 |
| POST | `/api/admin/rooms/toggle` | `{ "token": "xxx" }` | 启用/停用房间 |
| POST | `/api/admin/domain` | `{ "domain": "xxx" }` | 更新域名配置 |
| POST | `/api/admin/change-password` | `{ "oldPassword": "xxx", "newPassword": "xxx" }` | 修改密码 |

### 认证方式
所有管理接口需在 Header 中携带：
```
Authorization: Bearer {session_token}
```
Session 有效期 24 小时。