# ClipRelay · 剪贴板接力

基于时间窗口的私有房间制文本/图片中继系统。解决多设备间临时内容传递的痛点。

---

## 在线演示

无需安装，打开即用：

> **演示房间**：[relay.itellme.icu](https://relay.itellme.icu/?token=test-wge734dpyax7)

### 操作步骤

1. **打开链接** — 进入演示房间，看到消息列表和底部输入框
2. **发送消息** — 输入任意文字按 Enter 发送（绿色气泡=你发的）
3. **模拟接力** — 在另一个设备/浏览器标签页打开同一链接，刚发的消息会以蓝色气泡出现
4. **点击复制** — 点击任意消息卡片，内容自动复制到剪贴板
5. **拖选复制** — 选中部分文字松手，仅复制选中片段
6. **图片** — Ctrl+V 粘贴截图，或点图片按钮上传

> 演示房间有效期 30 分钟，超时自动销毁。

---

## 痛点问题

在手机和电脑之间传递文字、链接、截图、代码时：

- 打开微信/QQ → 找到「文件传输助手」→ 粘贴 → 发送 → 电脑端打开 → 复制 → 使用
- 传图片：发送 → 下载 → 打开 → 复制 / 另存为
- 传代码：消息气泡破坏缩进 → 格式全丢 → 重新排版

**每一步都是摩擦。** 这些工具的设计目标是「永久存储」，而不是「30 秒用完即弃」。

---

## 解决思路

```
手机端：打开链接 → 粘贴内容/图片 → 发送
电脑端：打开链接 → 内容已自动复制到剪贴板 → 直接用
```

**核心设计原则：**

| 原则 | 说明 |
|------|------|
| **点击复制** | 点击消息复制全部内容；拖选部分文字松手仅复制选中片段 |
| **聊天气泡** | 本机消息右侧绿色，远端消息左侧浅蓝，微信风格 |
| **临时房间** | 默认 30 分钟生命周期，也可设为永久房间 |
| **无账号** | 一个 token 即一个房间，分享链接即分享房间 |
| **格式保留** | Tab 缩进、换行符原样保留 |
| **图片支持** | 粘贴 / 拖放 / 选择图片，消息内显示缩略图 |

---

## 功能概览

- 管理后台：创建房间、设置有效期（临时/永久）、复制链接、清空/删除房间
- 微信风格气泡：本机绿色（右侧），远端浅蓝（左侧），非对称圆角
- 文本/图片实时接力，点击消息复制完整内容
- 滑动选择部分文字，松手自动复制选中片段
- 桌面通知：切到其他窗口时弹出新消息提醒
- 亮色/暗色模式，跟随系统偏好
- 历史消息折叠，不影响阅读新消息
- 房间启用/停用开关，过期自动清理
- Docker 单容器部署，SQLite 持久化

---

## 使用教程

### 快速开始

```bash
cd clip-relay
npm install
npm start
```

终端会打印管理员密码：

```
[clip-relay] 管理员密码: xxxxxxxxxxxx
[clip-relay] 管理后台 → http://0.0.0.0:3000/admin
```

### 完整流程

1. 浏览器打开 `http://localhost:3000`（自动跳转管理后台）
2. 输入密码登录（首次启动随机生成，打印在终端，也可在 `config.json` 查看）
3. 点击「创建新房间」：
   - 输入房间名称（如「我的工作区」）
   - 选择有效期：30分钟 / 1小时 / 2小时 / 24小时 / **永久**
   - Token 自动生成为 `房间名-12位随机字符`
4. 点「复制链接」→ 选择本机/局域网/公网
5. 在手机或其他设备打开该链接，自动进入房间
6. 发送文字、粘贴图片，另一端自动收到

### 文本接力

- 发送端：输入文字 → Enter 发送（Shift+Enter 换行）
- 接收端：消息到达 → 点击消息卡片复制全部内容，或拖选部分文字松手复制选中片段
- 粘贴代码：Tab 缩进完整保留

### 图片接力

- 三种发送方式：Ctrl+V 粘贴 / 点图片按钮选择 / 拖放图片到页面
- 消息列表显示缩略图，点击放大查看

### 界面说明

| 区域 | 说明 |
|------|------|
| 消息列表 | 左侧浅蓝气泡=远端，右侧绿色气泡=本机，hover 显示时间 |
| 输入栏 | 底部，Enter 发送，Shift+Enter 换行 |
| 房间横幅 | 顶部中央显示房间名称，圆角胶囊样式 |
| 主题切换 | 右上角按钮，亮色/暗色切换 |
| 桌面通知 | 切到其他窗口时收到消息会弹通知 |

---

## 配置文件

```json
{
  "defaultToken": "clip-relay",
  "port": 3000,
  "maxImageSize": 5242880,
  "domain": "",
  "adminPassword": ""
}
```

| 字段 | 说明 |
|------|------|
| `defaultToken` | 默认房间令牌 |
| `port` | 服务端口 |
| `maxImageSize` | 单张图片最大字节数（默认 5MB） |
| `domain` | 公网域名（配置后复制链接出现公网选项） |
| `adminPassword` | 管理员密码（留空则首次启动随机生成并写入） |

> **忘记密码**：查看 `config.json` 中的 `adminPassword` 字段，或删除该字段重启服务。

---

## 管理后台

访问 `http://localhost:3000/admin`

### 功能

- 创建房间（名称、自定义 Token、有效期）
- 房间列表（消息数、在线人数、创建时间、启用/停用状态）
- 复制链接（本机 / 局域网 / 公网三选一）
- 清空消息、删除房间
- 修改管理员密码（同步更新 config.json）
- 配置公网域名

### 安全机制

- 登录限流：同一 IP 1 分钟内最多 5 次尝试，超出封禁 5 分钟
- 密码以 SHA256 哈希存储
- 封禁提示会引导查看 config.json 恢复密码

---

## Docker 部署

```bash
docker compose up -d
```

数据文件通过 volume `clip-relay-data` 持久化，重启不丢失。

挂载自定义配置：

```yaml
services:
  clip-relay:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./config.json:/app/config.json:ro
      - clip-relay-data:/app/data
    restart: unless-stopped
```

---

## Cloudflare Tunnel 外网访问

```bash
# 安装
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/

# 创建隧道
cloudflared tunnel login
cloudflared tunnel create clip-relay
cloudflared tunnel route dns clip-relay relay.yourdomain.com
```

`~/.cloudflared/config.yml`：

```yaml
tunnel: <TUNNEL_ID>
credentials-file: /root/.cloudflared/<TUNNEL_ID>.json
ingress:
  - hostname: relay.yourdomain.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
cloudflared tunnel run clip-relay
```

在管理后台「域名设置」中填入 `relay.yourdomain.com`，复制链接时即可选择公网访问。

> **安全提醒**：外网访问建议开启 Cloudflare HTTPS 和 WAF 限流。

---

## 技术架构

```
浏览器 ──WebSocket──▶ Node.js Server
                         │
                         ├── Room Manager（30min TTL / 永久）
                         │
                         └── SQLite（sql.js WASM，零编译依赖）
```

| 组件 | 技术 |
|------|------|
| 运行时 | Node.js |
| 实时通信 | WebSocket (ws) |
| 数据存储 | SQLite (sql.js WASM) |
| 前端 | 原生 HTML/CSS/JS，单文件，无框架，微信风格气泡 |
| 部署 | Docker / 直接运行 |

---

## 安全边界

- 安全依赖 **token 强度** × **HTTPS 传输**
- 管理后台独立密码认证 + 登录限流
- 无账号系统、无权限控制
- 无内容加密（依赖 HTTPS）
- 建议配合 Nginx / Cloudflare 实现 HTTPS 和限流
