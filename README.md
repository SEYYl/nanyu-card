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
| 密码 | `admin123` |

> 首次登录后请立即在后台 **修改密码**。

---

### 方式二：Docker Compose（推荐）

```bash
# 1. 复制环境变量（如需调整）
cp .env.example .env

# 2. 构建并启动
docker compose up -d --build

# 3. 查看日志
docker compose logs -f app

# 4. 停止
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

- [ ] 修改默认密码 `admin123`
- [ ] 设置强随机的 `SESSION_SECRET`
- [ ] 通过反向代理启用 HTTPS（否则浏览器不会保留登录 Cookie）
- [ ] 不要直接对外暴露 3000 端口
- [ ] 定期备份 `data/app.json` 与 `uploads/`

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

- 新密码至少 4 位
- 确认已登录态（Cookie 失效后请重新登录）

### 5. 升级后字段为空

老版本数据文件没有 `focus_areas / skills / highlights`，程序会在加载时自动使用默认值。无需手动迁移。

---

## 📜 许可证

MIT