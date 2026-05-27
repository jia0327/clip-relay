<p align="center">
  <img src="./public/icon.svg" alt="ClipRelay Logo" width="128" />
</p>

<p align="center">
  基于时间窗口的私有房间制文本/图片中继系统
</p>

<p align="center">
  <a href="https://github.com/jia0327/clip-relay/stargazers"><img src="https://img.shields.io/github/stars/jia0327/clip-relay" alt="Stars" /></a>
  <a href="https://github.com/jia0327/clip-relay/releases/latest"><img src="https://img.shields.io/github/v/release/jia0327/clip-relay?display_name=tag" alt="Latest Release" /></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue" alt="License: MIT" /></a>
</p>

<p align="center">
  <a href="#在线演示">在线演示</a> ·
  <a href="#部署方式">部署</a> ·
  <a href="#快速开始">使用</a> ·
  <a href="#部署方式">云端部署</a>
</p>

---

## 在线演示

无需安装，打开即用：

> **演示房间**：[relay.itellme.icu](https://relay.itellme.icu/?token=test-wge734dpyax7)

### 操作步骤

1. **打开链接** — 进入演示房间
2. **发送消息** — 输入文字按 Enter 发送
3. **模拟接力** — 另一个设备打开同一链接，消息会以蓝色气泡出现
4. **点击复制** — 点击消息卡片自动复制到剪贴板
5. **拖选复制** — 选中部分文字松手，仅复制选中片段
6. **图片** — Ctrl+V 粘贴截图，或点图片按钮上传

> 演示房间有效期 30 分钟，超时自动销毁。

---

## 痛点问题

在手机和电脑之间传递文字、链接、截图、代码时：

- 打开微信/QQ → 找到「文件传输助手」→ 粘贴 → 发送 → 电脑端打开 → 复制 → 使用
- 传图片：发送 → 下载 → 打开 → 复制
- 传代码：消息气泡破坏缩进 → 格式全丢 → 重新排版

**每一步都是摩擦。** 微信/QQ 为了让你能翻聊天记录，消息永久保存在服务器上。但传临时内容只需要「用完即弃」——发完、复制、关掉。

---

## 解决思路

```
手机端：打开链接 → 粘贴内容/图片 → 发送
电脑端：打开链接 → 点击消息复制内容 → 直接用
```

**核心设计：**

| 设计 | 说明 |
|------|------|
| **点击复制** | 点击消息复制全部内容；拖选部分文字松手仅复制选中片段 |
| **聊天气泡** | 本机消息右侧绿色，远端消息左侧浅蓝 |
| **临时房间** | 默认 30 分钟生命周期，也可设为永久 |
| **无账号** | 一个 token 即一个房间，分享链接即分享房间 |
| **格式保留** | Tab 缩进、换行符原样保留 |
| **图片支持** | 粘贴 / 拖放 / 选择图片，缩略图显示 |

---

## 功能概览

- 管理后台：创建房间、设置有效期、复制链接、清空/删除房间
- 微信风格气泡：本机绿色（右侧），远端浅蓝（左侧）
- 文本/图片实时接力，点击消息复制完整内容
- 滑动选择部分文字，松手自动复制选中片段
- 桌面通知：切到其他窗口时弹出新消息提醒
- 亮色/暗色模式，跟随系统偏好
- 房间启用/停用开关，过期自动清理

---

## 部署方式

### 方式一：本地部署

适合个人临时使用。

```bash
npm install
npm start
```

终端打印管理员密码，浏览器访问 `http://localhost:3000/admin` 登录。

### 方式二：Docker 部署

适合 24 小时在线的设备（NAS、VPS、N1 等）。

```bash
cd deploy/docker
docker compose up -d
```

### 方式三：Cloudflare 一键部署（推荐）

零服务器维护，完全托管在 Cloudflare 免费额度内。

#### 可视化部署

1. Fork 本仓库到你的 GitHub
2. 进入 [Cloudflare D1](https://dash.cloudflare.com/?to=/:account/d1) 创建数据库 `clip-relay`，复制 Database ID
3. 进入 [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens) 创建自定义 Token：
   - 权限：`Zone - Workers and Workers Routes - Edit`、`D1 - Edit`
4. 进入你 Fork 的仓库 → **Settings** → **Secrets** → 添加 3 个：
   - `D1_DATABASE_ID`：步骤 2 的 Database ID
   - `CF_ACCOUNT_ID`：Cloudflare 账户 ID（首页右侧底部）
   - `CF_API_TOKEN`：步骤 3 的 Token
5. 进入 **Actions** → **Deploy to Cloudflare Workers** → **Run workflow**

等待 1-2 分钟部署完成。

#### 访问

- **API**: `https://clip-relay.<你的账户>.workers.dev/api/config`
- **WebSocket**: `wss://clip-relay.<你的账户>.workers.dev/ws?token=<房间令牌>`

#### 绑定自定义域名

Workers → clip-relay → Settings → Triggers → Custom Domains

---

## 快速开始

### 1. 启动服务

```bash
cd clip-relay
npm install
npm start
```

终端输出：

```
[clip-relay] 管理员密码: xxxxxxxxxxxx
[clip-relay] 管理后台 → http://0.0.0.0:3000/admin
```

### 2. 管理后台

浏览器打开 `http://localhost:3000/admin`，输入密码登录。

### 3. 创建房间

- 输入房间名称
- 选择有效期
- 点击「复制链接」分享给其他设备

### 4. 使用

- 发送端：输入文字 → Enter 发送
- 接收端：点击消息复制全部内容，或拖选部分文字松手复制
- 图片：Ctrl+V 粘贴 / 点图片按钮 / 拖放图片

---

## 配置文件

`config/config.json`:

```json
{
  "defaultToken": "clip-relay",
  "port": 3000,
  "maxImageSize": 5242880,
  "domain": "",
  "adminPassword": "",
  "resetKey": ""
}
```

| 字段 | 说明 |
|------|------|
| `defaultToken` | 默认房间令牌 |
| `port` | 服务端口 |
| `maxImageSize` | 单张图片最大字节数（默认 5MB） |
| `domain` | 公网域名（Cloudflare 部署时使用） |
| `adminPassword` | 管理员密码（留空则首次启动随机生成） |
| `resetKey` | 密码重置密钥（32 位随机字符串，输入即重置密码为 `admin`） |

> **忘记密码**：在登录页输入 `resetKey` 即可重置密码为 `admin`。`resetKey` 在 `config.json` 中查看，或首次启动时终端打印。

---

## 技术架构

```
浏览器 ──WebSocket──▶ Node.js / Workers
                         │
                         ├── Room Manager（TTL / 永久）
                         │
                         └── SQLite（sql.js / D1）
```

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js / Cloudflare Workers |
| 实时通信 | WebSocket |
| 数据存储 | SQLite (sql.js / D1) |
| 前端 | 原生 HTML/CSS/JS，无框架 |
| 部署 | 本地 / Docker / Cloudflare |

---

## 安全边界

- 安全依赖 **token 强度** × **HTTPS 传输**
- 管理后台独立密码认证 + 登录限流
- 无账号系统、无权限控制
- 无内容加密（依赖 HTTPS）
- 建议配合 Cloudflare 实现 HTTPS 和防护

---

## 开源协议

MIT License

---

## 致谢

- [Cloudflare Workers](https://workers.cloudflare.com/) - 无服务器平台
- [sql.js](https://sql.js.org/) - SQLite WASM 实现
- [ws](https://github.com/websockets/ws) - Node.js WebSocket