# Cloudflare 一键部署

Fork 本仓库，配置 3 个参数，手动触发部署。

---

## 第一步：Fork 仓库

点击 GitHub 右上角 **Fork** 按钮

---

## 第二步：在 Cloudflare 获取 3 个参数

### 1. D1 Database ID

1. 登录 [Cloudflare](https://dash.cloudflare.com) → **D1** → **Create Database**
2. 输入名称 `clip-relay`，点击创建
3. 点击数据库进入详情，复制 **Database ID**

### 2. Account ID

登录后，右侧底部查看 **Account ID**，复制

### 3. API Token

1. 头像 → **Profile** → **API Tokens** → **Create Custom Token**
2. 配置：
   - **Token name**: `clip-relay`
   - **Permissions**: 
     - `Zone - Workers and Workers Routes - Edit`
     - `D1 - Edit`
   - **Account Resources**: `Include - All Accounts`
3. 创建后复制 Token

---

## 第三步：配置 GitHub Secrets

进入 fork 的仓库 → **Settings** → **Secrets and variables** → **Actions** → **New secret**

| Secret Name | 值 |
|-------------|-------|
| `D1_DATABASE_ID` | 步骤 2.1 的 Database ID |
| `CF_ACCOUNT_ID` | 步骤 2.2 的 Account ID |
| `CF_API_TOKEN` | 步骤 2.3 的 API Token |

---

## 第四步：手动触发部署

进入仓库 → **Actions** → **Deploy to Cloudflare Workers** → **Run workflow** → 点击绿色按钮

等待 1-2 分钟部署完成。

---

## 完成

部署完成后首次访问时，系统会自动初始化 D1 表结构（messages、rooms、settings、sessions、rate_limits），无需手动执行 SQL。

- **API 地址**: `https://clip-relay.<你的账户>.workers.dev/api/config`
- **WebSocket**: `wss://clip-relay.<你的账户>.workers.dev/ws?token=<房间令牌>`
- **管理员**: 初始密码为 `admin`，登录后请立即修改

### 忘记密码

在 Cloudflare 中修改 `RESET_KEY` 环境变量为任意值，登录页输入该值即可重置密码为 `admin`。

### 绑定自定义域名

1. 进入 **Workers & Pages** → **clip-relay** → **Settings** → **Triggers**
2. 点击 **Custom Domains** → **Add Custom Domain**
3. 输入你的域名（如 `relay.yourdomain.com`）
4. 确保域名 DNS 已托管到 Cloudflare

---

## 费用

| 资源 | 免费额度 | 预估用量 |
|------|---------|---------|
| Workers 请求 | 100,000 次/天 | < 1,000 次 |
| D1 读取 | 5,000,000 次/天 | < 10,000 次 |
| D1 写入 | 100,000 次/天 | < 500 次 |
| D1 存储 | 5 GB | < 50 MB |

**个人使用完全免费。**