# Nanyu Card

一个简洁、现代的个人数字名片网站。前台展示个人介绍、经历与能力、项目作品和联系方式；后台可在线编辑内容并管理上传。适配 Docker / 1Panel 部署。

![Tech](https://img.shields.io/badge/frontend-Vue%203%20%2B%20Vite-4f9fff) ![Tech](https://img.shields.io/badge/backend-Node.js%20%2B%20Express-7c4dff) ![Deploy](https://img.shields.io/badge/deploy-Docker-2496ED)

## ✨ 特性

- 🎴 **前台展示**：个人简介、关注方向、经历亮点、技能栈、项目作品、联系方式、备案信息
- 🛠 **后台可编辑**：站点信息、项目、关注方向、技能、经历亮点均可后台维护
- 🖼 **图片上传**：支持头像和项目封面上传，自动控制大小与类型
- 🔐 **登录鉴权**：账号密码登录后写入 Cookie Session，密码使用 bcrypt 散列保存
- 🔍 **SEO 友好**：语义化结构、Open Graph / Twitter 元信息、robots.txt、sitemap.xml
- 📱 **响应式**：桌面 + 移动端自适应，含移动端折叠导航
- 🚀 **一键部署**：`docker compose up -d` 即可启动，适配 1Panel
- 💾 **零依赖数据库**：使用 JSON 文件存储，便于备份与迁移

---

## 📁 项目结构

```text
.
├── frontend/          # Vue 3 + Vite 前端
│   ├── src/
│   │   ├── App.vue
│   │   ├── main.ts
│   │   └── style.css
│   ├── public/        # 静态资源（构建时原样拷贝）
│   └── index.html
├── backend/           # Express + TypeScript 后端
│   ├── src/
│   │   ├── index.ts   # HTTP 服务
│   │   └── db.ts      # JSON 存储 + 密码散列
│   ├── data/          # 运行期数据（运行时创建）
│   ├── uploads/       # 用户上传的图片（运行时创建）
│   └── package.json
├── docker-compose.yml
├── Dockerfile
├── .env.example
└── README.md
```

---

## 🚀 快速开始

### 方式一：本地开发

#### 1. 启动后端

```bash
cd backend
npm install
npm run dev
```

后端默认监听 `http://localhost:3000`。

#### 2. 启动前端（新开终端）

```bash
cd frontend
npm install
npm run dev
```

前端默认监听 `http://localhost:5173`，`/api` 已通过 Vite 代理转发到后端。

#### 3. 访问

- 前台：http://localhost:5173/
- 后台：http://localhost:5173/ → 点击右上角 **进入后台**

默认后台账号：

| 字段 | 值 |
| --- | --- |
| 用户名 | `admin` |
| 密码 | **随机生成**，首次启动时打印在终端 / Docker 日志中 |

> 如何获取初始密码？见下方 [🔐 获取初始密码](#-获取初始密码)。
> 登录后请立即在后台 **修改密码**。

---

### 方式二：Docker Compose（推荐）

```bash
# 1. 复制环境变量模板
cp .env.example .env

# 2. 编辑 .env，至少修改 SESSION_SECRET 和 SITE_URL
#    SITE_URL 必须填写你的 HTTPS 域名，如 https://nanyu.xin
nano .env

# 3. 构建并启动
docker compose up -d --build

# 4. 查看日志
docker compose logs -f app

# 5. 停止
docker compose down
```

访问：http://localhost:3000/

数据与上传图片通过 volume 挂载到宿主机的 `./data` 和 `./uploads`，升级或迁移时只需保留这两个目录。

---

## 🧩 1Panel 部署

1. 在 1Panel 应用列表中创建一个 **Compose 应用**。
2. 选择「本地创建」或拉取你的 Git 仓库。
3. 在 1Panel 中调整 `.env` 或环境变量：
   - `SESSION_SECRET`：改为一段长随机字符串
   - `PORT`：默认 3000
4. 进入站点目录执行：

   ```bash
   docker compose up -d --build
   ```

5. 在 1Panel「网站 → 创建网站」中：
   - 类型选择 **反向代理**
   - 代理地址填写 `http://<容器宿主机IP>:3000`，或使用 1Panel 内置的容器发现 `nanyu-card:3000`
6. 在「证书管理」中申请 HTTPS（Let's Encrypt / 阿里云 / 自定义均可）。
7. 推荐开启 **HTTPS → 强制 HTTPS**。

> 建议不要将容器的 3000 端口直接对外，仅暴露给反向代理。

---

## 🌐 域名与 HTTPS

- 推荐使用 Nginx / Caddy / 1Panel 自带反向代理
- 在反代配置中将请求转发到容器 `3000` 端口
- 在证书管理中申请证书并配置 HTTPS
- 由于后端 Session Cookie 设置了 `secure`（生产环境），必须使用 HTTPS 才能保持登录状态

最小 Nginx 反代示例：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

---

## 🛡 安全建议

部署到公网前请务必：

- [ ] 登录后台后立即修改密码
- [ ] 设置强随机的 `SESSION_SECRET`（`openssl rand -hex 32`）
- [ ] 通过反向代理启用 HTTPS（否则浏览器不会保留登录 Cookie）
- [ ] 不要直接对外暴露 3000 端口
- [ ] 定期备份 `data/app.json` 与 `uploads/`

后端已内置以下安全措施：

| 措施 | 说明 |
|------|------|
| Helmet | CSP / X-Frame-Options / X-Content-Type-Options 等安全头 |
| Rate Limit | 登录 15 分钟最多 10 次，全局 API 15 分钟 500 次 |
| CORS 白名单 | 生产环境仅允许 `SITE_URL` 指定的域名跨域 |
| bcrypt | 密码使用 bcrypt 散列存储（cost 10） |
| Session | httpOnly + sameSite:lax + secure（生产环境强制 HTTPS） |
| 密码策略 | 最短 8 位 |
| 随机初始密码 | 不再硬编码，每次全新部署生成不同密码 |

---

## 💾 备份与恢复

### 备份

需要保留的内容：

```bash
data/app.json    # 站点配置、项目数据、管理员密码（已散列）
uploads/         # 用户上传的头像与项目封面
```

简单的 tar 备份：

```bash
tar -czf nanyu-card-backup-$(date +%Y%m%d).tar.gz data uploads
```

### 恢复

```bash
# 解压到项目根目录
tar -xzf nanyu-card-backup-20251201.tar.gz

# 重启容器
docker compose restart
```

---

## ⬆️ 升级

```bash
# 拉取最新代码 / 重新构建
git pull
docker compose up -d --build

# 数据和上传通过 volume 挂载，无需迁移
```

如果升级涉及数据字段新增（如本次新增 `focus_areas / skills / highlights`），程序会自动使用默认值，无需手动迁移。

---

## 🔧 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 后端监听端口 |
| `NODE_ENV` | （自动） | `production` 时 Session Cookie 启用 `secure` |
| `SESSION_SECRET` | `nanyu-card-secret` | Session 加密密钥，**生产环境务必修改** |
| `SITE_URL` | （空） | 你的 HTTPS 域名（如 `https://nanyu.xin`），生产环境 CORS 白名单，**必须配置，否则页面白屏** |
| `DB_PATH` | `backend/data/app.json` | 数据文件路径（容器内建议挂载到 `/app/data/app.json`） |

完整环境变量模板见 `.env.example`。

---

## 🧪 API 一览

公开接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/site-config` | 获取站点配置 |
| GET | `/api/projects` | 获取项目列表 |
| GET | `/api/health` | 健康检查 |
| GET | `/uploads/*` | 访问上传的图片 |

后台接口（需登录）：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/admin/login` | 登录（{username, password}） |
| POST | `/api/admin/logout` | 退出登录 |
| GET | `/api/admin/session` | 检查登录态 |
| POST | `/api/admin/site-config` | 更新站点配置（含 highlights / focus_areas / skills） |
| POST | `/api/admin/projects` | 新增项目 |
| PUT | `/api/admin/projects/:id` | 更新项目 |
| DELETE | `/api/admin/projects/:id` | 删除项目 |
| POST | `/api/admin/upload` | 上传图片（multipart/form-data，字段名 `file`） |
| POST | `/api/admin/password` | 修改密码（{password}） |

---

## 🔐 获取初始密码

首次部署时，系统会随机生成管理员密码并打印到控制台，**不会**写入任何文件。

### 本地开发

启动后端后，终端会直接显示：

```
========================================
  初始管理员密码: a7f3e1c8b2d9
  请登录后台后立即修改密码
========================================
```

### Docker Compose

```bash
# 首次启动（前台运行，直接看到密码）
docker compose up

# 如果已经在后台运行，查看启动日志
docker compose logs app | grep -A2 "初始管理员密码"
```

### 1Panel

在容器管理页面点击「日志」，启动日志中会包含密码信息。

### 密码只会打印一次

- 密码**仅在** `data/app.json` 不存在时生成并打印
- 一旦数据文件生成，后续重启**不会**再打印密码
- 如果你错过了日志输出，或者忘记了密码，见下方 [故障排查 → 忘记了管理员密码](#4-忘记了管理员密码)

### Docker 额外注意

如果你用 `docker compose up -d` 首次启动（后台运行），终端不会显示日志。此时用以下命令查看：

```bash
docker compose logs app
```

建议首次部署时先用前台模式确认密码：

```bash
docker compose up    # 看到密码后 Ctrl+C
docker compose up -d # 正式后台运行
```

---

## 🧯 故障排查

### 1. 打开后台页提示「请先登录」

- 确认使用了 HTTPS（生产环境），否则浏览器会拒绝带 `secure` Cookie 的请求
- 检查反向代理是否带上了 `X-Forwarded-Proto`，如有需要再启用 `app.set('trust proxy', 1)`（可在后端按需开启）

### 2. 启动时端口被占用

后端会自动尝试 `port + 1`，日志中会有 `Port 3000 is busy, trying 3001...`。如需固定端口，请确保宿主机 3000 端口空闲。

### 3. 图片上传 400

- 检查文件是否为图片格式（multer 会拒绝非 `image/*`）
- 检查大小是否超过 5 MB

### 4. 修改密码失败

- 新密码至少 **8** 位
- 确认已登录态（Cookie 失效后请重新登录）

### 5. 忘记了管理员密码

密码以 bcrypt 散列形式存储在 `data/app.json` 中，无法反向破解。两种方法重置：

**方法一：删掉 admin 用户，重启自动重建**

删除 `data/app.json` 中 `users` 数组里的 admin 对象（保留其他数据），重启后会自动重新创建并打印新密码。

> ⚠️ 如果直接删掉整个 `data/app.json`，站点配置和项目数据也会一起丢失。

**方法二：用脚本直接替换密码散列（推荐）**

在项目 `backend/` 目录下执行：

```bash
node -e "
const bcrypt = require('bcryptjs');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/app.json', 'utf8'));
const user = data.users.find(u => u.username === 'admin');
if (user) {
  user.password_hash = bcrypt.hashSync('你的新密码', 10);
  fs.writeFileSync('data/app.json', JSON.stringify(data, null, 2));
  console.log('密码已更新');
}
"
```

重启服务后即可用新密码登录，**所有数据保持不变**。

### 6. 升级后字段为空

老版本数据文件没有 `focus_areas / skills / highlights`，程序会在加载时自动使用默认值。无需手动迁移。

---

## 📜 许可证

MIT