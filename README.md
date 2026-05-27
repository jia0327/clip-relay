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

---

## 这是什么

手机和电脑之间传文字、链接、截图时，不用再登录微信/QQ 找文件传输助手。打开同一个链接，粘贴、发送，另一端点击即复制。

- **临时房间** — 一个 token 一个房间，分享链接即加入
- **点击复制** — 点消息复制全部，拖选复制部分
- **用完即弃** — 默认 30 分钟自动销毁，无需清理

---

## 在线演示

> **演示房间**：[cliprelay.itellme.icu](https://cliprelay.itellme.icu/?token=demo-vd7ftpaiyyue)

用两个设备打开同一链接，测试实时消息接力。

---

## 部署方式

### 本地部署

```bash
npm install
npm start
```

终端打印管理员密码，浏览器访问 `http://localhost:3000/admin`。

### Docker 部署

```bash
cd deploy/docker
docker compose up -d
```

适合 NAS / VPS 等 24 小时在线设备。

### Cloudflare 部署（推荐）

零服务器，完全免费托管。

1. Fork 本仓库
2. [Cloudflare D1](https://dash.cloudflare.com/?to=/:account/d1) → 创建数据库 `clip-relay` → 复制 **Database ID**
3. [API Tokens](https://dash.cloudflare.com/profile/api-tokens) → 创建令牌 → **编辑 Cloudflare Workers** → 权限新增 **账户-D1-编辑** → 复制 **Token**
4. Fork 的仓库 → Settings → Secrets → 添加三个：
   - `D1_DATABASE_ID`
   - `CF_ACCOUNT_ID`
   - `CF_API_TOKEN`
5. Actions → Deploy to Cloudflare Workers → Run workflow

部署完成后绑定自定义域名：Workers → clip-relay → Settings → Triggers → Custom Domains。

---

## 使用

### 管理后台

`http://localhost:3000/admin`（或你的域名 `/admin`），默认密码 `admin`。

- 创建房间、设置有效期
- 查看消息数、在线设备
- 停用/删除房间
- 修改密码

### 房间页面

打开 `/?token=<房间令牌>`：

- 输入文字按 Enter 发送（Shift+Enter 换行）
- 点击消息复制全部，拖选复制片段
- Ctrl+V / 拖放 / 按钮上传图片
- 绿色气泡 = 本机，蓝色气泡 = 远端
- 切到后台时弹出桌面通知

---

## 配置

`config/config.json`：

| 字段 | 说明 |
|------|------|
| `defaultToken` | 默认房间令牌 |
| `port` | 服务端口 |
| `maxImageSize` | 图片上限（默认 5MB） |
| `domain` | 公网域名 |
| `resetKey` | 密码重置密钥（自动生成），登录页输入即重置为 `admin` |

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js / Cloudflare Workers |
| 通信 | WebSocket |
| 存储 | SQLite（sql.js WASM / D1） |
| 前端 | 原生 HTML/CSS/JS，零框架 |

---

## License

MIT
