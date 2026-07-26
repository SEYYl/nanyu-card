# Nanyu Card 容器部署指南（小白版）

> 本文档假设你**完全没有接触过 Docker**，每一步都会解释在做什么、为什么这么做。跟着走，30 分钟内就能把网站部署上线。

---

## 目录

1. [前置知识：几个必须懂的词](#1-前置知识几个必须懂的词)
2. [第一步：安装 Docker](#2-第一步安装-docker)
3. [第二步：把项目代码传到服务器](#3-第二步把项目代码传到服务器)
4. [第三步：配置环境变量](#4-第三步配置环境变量)
5. [第四步：一条命令启动](#5-第四步一条命令启动)
6. [第五步：获取管理员密码并登录](#6-第五步获取管理员密码并登录)
7. [第六步：配置域名和 HTTPS（可选但强烈推荐）](#7-第六步配置域名和-https可选但强烈推荐)
8. [日常操作：停止、重启、更新](#8-日常操作停止重启更新)
9. [数据备份与恢复](#9-数据备份与恢复)
10. [常见问题排查](#10-常见问题排查)

---

## 1. 前置知识：几个必须懂的词

开始之前，先理解几个概念，后面你会反复看到它们。

### Docker（容器引擎）

你可以把 Docker 理解成一个**轻量级虚拟机**。它能把你的网站和所有依赖（Node.js、npm 包等）打包成一个"盒子"，这个盒子在任何服务器上都能以**完全相同的方式**运行。

好处：不用在服务器上装 Node.js、不用管版本兼容、不会搞乱服务器环境。

### 镜像（Image）

镜像就是那个"盒子"的**设计图纸**。它定义了这个盒子里有什么文件、装了什么软件、启动时执行什么命令。

类比：镜像 = 蛋糕配方，容器 = 烤出来的蛋糕。

### 容器（Container）

容器是根据镜像"跑起来"的**实例**。你可以在同一台机器上从同一个镜像跑出多个容器。容器之间互相隔离，互不影响。

### Docker Compose

Docker Compose 是一个**编排工具**。如果你只需要一个容器，可以直接用 `docker run`；但用 Compose 写一个配置文件（`docker-compose.yml`），好处是配置可复用、可版本管理，一个命令就能启动/停止。

### 端口映射（Port Mapping）

容器内部有自己的网络，外部无法直接访问。端口映射就是把**宿主机的端口**（比如 3000）"转发"到**容器内部的端口**（也是 3000）。

类比：宿主机 3000 端口 = 公司大门，容器内 3000 端口 = 你工位的分机号。外面的人打公司大门（访问 `服务器IP:3000`），自动转接到你工位（容器内 Express 服务）。

### 数据卷挂载（Volume Mount）

容器一旦被删除，容器内的所有文件也会消失。为了让数据（数据库、上传的图片）持久保留，你需要把容器内的某个目录"映射"到宿主机上的真实目录。

类比：容器里的 `/app/data` 其实是宿主机上 `./data` 文件夹的"快捷方式"。容器删了，文件还在。

在这个项目中：

| 容器内路径          | 宿主机路径             | 存了什么                 |
| -------------- | ----------------- | -------------------- |
| `/app/data`    | 项目目录下的 `data/`    | JSON 数据库（站点配置、密码、项目） |
| `/app/uploads` | 项目目录下的 `uploads/` | 你上传的头像和项目封面          |

---

## 2. 第一步：安装 Docker

### 2.1 在 Linux 服务器上安装（最常见的情况）

如果你用的是 Ubuntu / Debian：

```bash
# 1. 更新软件包列表
sudo apt update

# 2. 安装 Docker
sudo apt install docker.io docker-compose-v2 -y

# 3. 启动 Docker 服务
sudo systemctl enable docker --now

# 4. 验证安装成功
docker --version
docker compose version
```

如果你用的是 CentOS / Rocky Linux：

```bash
sudo yum install -y yum-utils
sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
sudo yum install docker-ce docker-compose-plugin -y
sudo systemctl enable docker --now
```

### 2.2 免 sudo 运行 Docker（可选但方便）

默认情况下，每次打 `docker` 命令都要加 `sudo`。如果觉得烦，把自己加到 `docker` 用户组：

```bash
sudo usermod -aG docker $USER
```

然后**退出终端重新登录**（或执行 `newgrp docker`），之后就不用 `sudo` 了。

### 2.3 在 Windows / macOS 上安装

- **Windows**：下载 [Docker Desktop](https://www.docker.com/products/docker-desktop/)，安装后重启电脑。
- **macOS**：同上，下载 Docker Desktop 安装即可。

> 如果你在 Windows/macOS 上只是本地测试，Docker Desktop 就够了。但正式部署通常是在 Linux 服务器上。

---

## 3. 第二步：把项目代码传到服务器

### 方式一：用 Git 克隆（推荐）

在服务器上：

```bash
# 进入你想放项目的目录
cd /home/你的用户名/

# 克隆项目
git clone <你的仓库地址>

# 进入项目目录
cd grzy
```

> 什么是 Git 克隆？就是把远程仓库的代码下载到本地。你的代码如果托管在 GitHub / GitLab / Gitee 上，就有对应的仓库地址。

### 方式二：用 SCP 上传

如果你没有用 Git，可以手动把本机上的项目文件夹整个传到服务器：

```bash
# 在你自己的电脑上执行（不是服务器上！）
scp -r C:\Users\nanyu\Desktop\grzy 用户名@服务器IP:/home/用户名/grzy
```

> 什么是 SCP？Secure Copy，通过 SSH 安全地把文件从一台电脑传到另一台电脑。

---

## 4. 第三步：配置环境变量

在项目目录下，有一个 `.env` 文件（如果不存在，复制 `.env.example` 并改名）。

```bash
# 如果还没有 .env 文件，就复制一份
cp .env.example .env
```

然后编辑 `.env` 文件：

```bash
nano .env
```

> 什么是 nano？一个简单的终端文本编辑器。按方向键移动光标，编辑完按 `Ctrl+O` 保存，再按 `Ctrl+X` 退出。

你会看到类似这样的内容：

```env
PORT=3000
NODE_ENV=production
SESSION_SECRET=please-change-this-to-a-long-random-string
SITE_URL=https://your-domain.com
DB_PATH=/app/data/app.json
```

**你需要改的是 `SESSION_SECRET` 和 `SITE_URL`**。把 `SESSION_SECRET` 改成一段**强的随机字符串**，把 `SITE_URL` 改成你的真实域名。

> 什么是 SESSION_SECRET？它是用来加密登录会话的密钥。如果泄露，别人就能伪造你的登录态。所以一定要改成别人猜不到的随机字符串。

> 什么是 SITE_URL？它是生产环境下 CORS 安全校验的来源白名单，必须设为你的完整 HTTPS 域名（如 `https://nanyu.xin`），末尾不要带 `/`。如果不配置，浏览器请求前端模块和 API 时会被 CORS 拒绝，导致页面白屏。

如何生成随机字符串？在终端运行：

```bash
openssl rand -hex 32
```

会输出类似 `a1b2c3d4e5f6...` 这样的 64 位随机字符串。把它替换到 `SESSION_SECRET=` 后面。

其他变量说明：

| 变量               | 含义                       | 需要改吗？    |
| ---------------- | ------------------------ | -------- |
| `PORT`           | 网站监听的端口                  | 不用改      |
| `NODE_ENV`       | 运行模式，`production` 就是生产模式 | 不用改      |
| `SESSION_SECRET` | 会话加密密钥                   | **必须改！** |
| `SITE_URL`       | 你的 HTTPS 域名（CORS 白名单）   | **必须改！** |
| `DB_PATH`        | 数据库文件在容器内的路径             | 不用改      |

---

## 5. 第四步：一条命令启动

终于到了激动人心的步骤。在项目根目录下执行：

```bash
docker compose up -d --build
```

这个命令在做什么？拆解一下：

| 部分               | 含义                        |
| ---------------- | ------------------------- |
| `docker compose` | 调用 Docker Compose 工具      |
| `up`             | 启动服务                      |
| `-d`             | detached 模式，在后台运行（终端不会卡住） |
| `--build`        | 启动前重新构建镜像（确保用的是最新代码）      |

第一次运行会花几分钟，因为需要：

1. 下载 Node.js 基础镜像（约 120MB）
2. 安装前端和后端的 npm 依赖
3. 编译前端和后端代码

之后再次执行会快很多，因为 Docker 会缓存中间步骤。

等待完成后，验证是否成功：

```bash
# 看看容器是不是在运行
docker compose ps
```

应该看到 `nanyu-card` 容器的状态是 `Up`（运行中）。

```bash
# 测试一下网站能否访问
curl http://localhost:3000/api/health
```

应该返回 `{"status":"ok"}`。

---

## 6. 第五步：获取管理员密码并登录

### 6.1 查看启动日志获取密码

首次部署时，系统会自动生成一个随机管理员密码，**打印在日志中**。

```bash
# 查看容器日志
docker compose logs app
```

在输出里找到类似这几行：

```
========================================
  初始管理员密码: a7f3e1c8b2d9
  请登录后台后立即修改密码
========================================
```

**这个密码只会在第一次启动时打印。** 一旦数据文件生成，之后重启就不会再显示了。所以请立刻记下来！

> 什么是日志？容器运行时产生的所有输出。我们就是在这里找密码的。

> 为什么密码只在第一次打印？因为系统检测到 `data/app.json` 文件不存在（说明是全新部署），就会生成密码并打印。文件一旦生成，之后重启就不会重复生成了。

### 6.2 如果你错过了日志输出

如果你启动时用了 `-d`（后台运行），而且日志已经被覆盖了，还是有办法：

**方法一**：删掉数据文件重新生成（数据会丢失）

```bash
# 停止容器
docker compose down

# 删掉数据文件（⚠️ 只建议在全新部署、还没录入数据时这么做）
rm data/app.json

# 重新前台启动（不加 -d），直接在终端看密码
docker compose up

# 看到密码后 Ctrl+C 停止，再用 -d 后台启动
docker compose up -d
```

**方法二**：用脚本直接重置密码（推荐）

```bash
# 进入后端目录
cd backend

# 生成新密码的散列值并写入数据文件
node -e "
const bcrypt = require('bcryptjs');
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/app.json', 'utf8'));
const user = data.users.find(u => u.username === 'admin');
if (user) {
  user.password_hash = bcrypt.hashSync('你设定的新密码', 10);
  fs.writeFileSync('data/app.json', JSON.stringify(data, null, 2));
  console.log('密码已更新为：你设定的新密码');
}
"

cd ..

# 重启容器使生效
docker compose restart
```

> 什么是 bcrypt？一种密码散列算法。它能把密码变成一串不可逆的乱码，存进数据库。即使数据库泄露，黑客也反推不出原始密码。

### 6.3 登录后台

打开浏览器，访问 `http://你的服务器IP:3000`，点击右上角或底部的 **进入后台**。

- 用户名：`admin`
- 密码：启动日志里那个（或你刚刚用脚本设置的）

**登录后立刻去后台修改密码！**

---

## 7. 第六步：配置域名和 HTTPS（可选但强烈推荐）

目前为止，你的网站可以通过 `http://服务器IP:3000` 访问。但这有几个问题：

1. 没有 HTTPS，浏览器会标记为"不安全"
2. 没有 HTTPS，登录 Cookie 无法在浏览器中保存（本项目的 Session Cookie 在生产模式下要求 `secure`）
3. 只能通过 IP + 端口访问，不够专业

### 7.1 为什么必须配 HTTPS？

本项目后端在 `NODE_ENV=production` 时，Session Cookie 会设置 `secure: true`。这意味着**浏览器只在 HTTPS 连接下才会发送 Cookie**。

如果你用 HTTP 访问，表现就是：输入密码点登录 → 提示登录成功 → 刷新页面 → 又回到未登录状态。这不是 bug，是安全机制。

所以要么配 HTTPS，要么把 `.env` 里的 `NODE_ENV` 改成 `development`（不推荐，不安全）。

### 7.2 最常用的方案：Nginx 反向代理 + Let's Encrypt 免费证书

#### 7.2.1 安装 Nginx

```bash
sudo apt install nginx -y
```

> 什么是 Nginx？一个高性能的 Web 服务器，常用来做**反向代理**——把外部请求转发到内部的服务。

#### 7.2.2 创建 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/nanyu-card
```

粘贴以下内容（把 `your-domain.com` 换成你的真实域名）：

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

    # 上传文件大小限制（默认只有 1MB，不够）
    client_max_body_size 10m;
}
```

> 这段配置的含义：监听 80 端口（HTTP），把所有请求转发到本机的 3000 端口（就是你的 Docker 容器映射出来的端口）。

#### 7.2.3 启用配置

```bash
# 创建软链接（相当于"启用"这个网站配置）
sudo ln -s /etc/nginx/sites-available/nanyu-card /etc/nginx/sites-enabled/

# 测试配置有没有语法错误
sudo nginx -t

# 重新加载 Nginx
sudo systemctl reload nginx
```

> 什么是软链接？类似 Windows 的快捷方式。Nginx 会自动加载 `/etc/nginx/sites-enabled/` 里的所有配置。

#### 7.2.4 安装 Certbot（Let's Encrypt 证书工具）

```bash
sudo apt install certbot python3-certbot-nginx -y
```

> 什么是 Let's Encrypt？一个免费、自动化的 SSL/TLS 证书颁发机构。Certbot 是它的命令行工具。

#### 7.2.5 申请证书并启用 HTTPS

```bash
sudo certbot --nginx -d your-domain.com
```

按提示操作：

1. 输入邮箱地址（用于证书到期提醒）
2. 同意服务条款
3. 选择是否重定向 HTTP 到 HTTPS（选 2，强制 HTTPS）

完成后，你的网站就能通过 `https://your-domain.com` 访问了。证书每 90 天自动续期，不用手动操作。

#### 7.2.6 DNS 前提条件

> 什么是 DNS？域名系统。它把人类好记的域名（如 `google.com`）翻译成机器用的 IP 地址（如 `142.250.80.46`）。

在申请证书之前，你需要：

1. 有一个域名（在阿里云、腾讯云、Cloudflare 等平台购买）
2. 在域名管理后台添加一条 **A 记录**，把域名指向你的服务器 IP

例如：

| 记录类型 | 主机记录 | 记录值        |
| ---- | ---- | ---------- |
| A    | @    | 你的服务器公网 IP |
| A    | www  | 你的服务器公网 IP |

修改后等待几分钟到几小时（DNS 传播需要时间），然后用 `ping your-domain.com` 验证是否解析成功。

### 7.3 如果你用 1Panel 面板

1Panel 是一个带 Web 界面的服务器管理面板，操作更直观：

1. 在 1Panel 的「应用商店」中创建 Compose 应用
2. 把项目代码上传或 Git 克隆到服务器
3. 在项目目录执行 `docker compose up -d --build`
4. 在「网站」→「创建网站」→ 类型选「反向代理」
5. 代理地址填 `http://127.0.0.1:3000`
6. 在「证书」中申请 Let's Encrypt 证书
7. 勾选「强制 HTTPS」

---

## 8. 日常操作：停止、重启、更新

### 8.1 停止网站

```bash
docker compose down
```

> 容器会被停止并删除，但数据文件（`data/` 和 `uploads/`）不受影响，因为它们挂载在宿主机上。

### 8.2 重启网站

```bash
docker compose up -d
```

（如果之前没有 `docker compose down` 过，也可以直接 `docker compose restart`）

### 8.3 查看运行状态

```bash
docker compose ps
```

### 8.4 实时查看日志

```bash
docker compose logs -f app
```

> `-f` 表示 follow，日志会实时滚动。按 `Ctrl+C` 退出。

### 8.5 更新到最新代码

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker compose up -d --build
```

> `--build` 会强制重新构建镜像，确保用的是最新代码。Docker 的缓存机制会让它很快完成（只重建有变化的部分）。

---

## 9. 数据备份与恢复

### 9.1 你的网站数据存在哪里？

这个项目**不使用传统数据库**（如 MySQL），所有数据存在两个地方：

1. `data/app.json` —— 站点配置、项目管理、管理员密码（已加密）
2. `uploads/` —— 用户上传的头像和项目封面图片

这两个目录通过 Docker 的卷挂载功能，直接保存在宿主机上，**不会随着容器删除而丢失**。

### 9.2 手动备份

```bash
# 在项目根目录执行，打包成带日期的压缩文件
tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" data/app.json uploads/
```

> 这个命令会把 `data/app.json` 和 `uploads/` 整个目录打包成一个压缩文件，文件名带日期戳。

### 9.3 自动备份（推荐）

创建一个每天自动执行的备份脚本：

```bash
# 创建备份脚本
nano ~/backup-nanyu-card.sh
```

写入以下内容：

```bash
#!/bin/bash
BACKUP_DIR="/home/你的用户名/backups"
PROJECT_DIR="/home/你的用户名/grzy"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/nanyu-card-$(date +%Y%m%d).tar.gz" \
  -C "$PROJECT_DIR" data/app.json uploads/
# 只保留最近 30 天的备份
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete
```

然后设置每天凌晨 3 点自动执行：

```bash
chmod +x ~/backup-nanyu-card.sh
(crontab -l 2>/dev/null; echo "0 3 * * * /home/你的用户名/backup-nanyu-card.sh") | crontab -
```

> 什么是 crontab？Linux 的定时任务工具。`0 3 * * *` 表示每天凌晨 3:00 执行。

### 9.4 恢复数据

```bash
# 解压备份文件到项目目录
tar -xzf backup-20260726-030000.tar.gz -C /home/你的用户名/grzy/

# 重启容器
cd /home/你的用户名/grzy
docker compose restart
```

---

## 10. 常见问题排查

### 问题 1：「端口已被占用」

```
Error starting userland proxy: listen tcp4 0.0.0.0:3000: bind: address already in use
```

**含义**：宿主机的 3000 端口已经被其他程序占用了。

**解决**：看看是谁在占用：

```bash
sudo lsof -i :3000
```

如果是你自己的另一个服务，在 `.env` 里改 `PORT=3001`（或其他未使用的端口），同时修改 `docker-compose.yml` 里的端口映射（如 `'3001:3001'`）。

### 问题 2：「登录后刷新页面就掉登录态」

**特征**：可以成功登录后台，但只要一刷新页面或者点其他链接，就提示"请先登录"。

**原因**：Session Cookie 设置了 `secure: true`，但你是通过 HTTP（而不是 HTTPS）访问的。浏览器拒绝在 HTTP 连接下发送 `secure` Cookie。

**解决**：两种方案：

A. **正规方案**：配置 HTTPS（参考第七步），一劳永逸。

B. **临时方案**：在 `.env` 中把 `NODE_ENV` 改成 `development`，然后重启容器：

```bash
docker compose down && docker compose up -d --build
```

⚠️ 这只适合本地测试，不要在生产环境用！

### 问题 3：「上传图片提示 413 Request Entity Too Large」

**原因**：Nginx 默认上传大小限制只有 1MB。

**解决**：在 Nginx 配置的 `server` 块中加上 `client_max_body_size 10m;`（参考第七步的 Nginx 配置示例），然后 `sudo nginx -t && sudo systemctl reload nginx`。

### 问题 4：「忘了管理员密码怎么办」

见 [第六步的 6.2 节](#62-如果你错过了日志输出)，用脚本直接重置密码。

### 问题 5：「怎么确认容器在正常运行？」

```bash
# 方法 1：查看容器状态
docker compose ps
# 输出中的 STATUS 应该是 "Up" 开头

# 方法 2：查看最新日志
docker compose logs --tail=50 app
# --tail=50 表示只看最近 50 行

# 方法 3：测试接口
curl http://localhost:3000/api/health
# 应该返回 {"status":"ok"}
```

### 问题 6：「npm install 报错，构建失败」

```bash
# 在项目目录下，完全清除 Docker 缓存后重试
docker compose down
docker builder prune -af
docker compose up -d --build
```

### 问题 7：「端口映射改了之后怎么访问？」

假如你把端口改成了 8080（`docker-compose.yml` 里改的），那么：

- 直接访问：`http://服务器IP:8080`
- Nginx 代理那行的 `proxy_pass` 也要对应改成 `http://127.0.0.1:8080`

### 问题 8：「页面打开白屏，什么内容都没有」

**特征**：配置了 HTTPS 和域名，但浏览器打开后一片空白，控制台可能显示 CSS/JS 请求返回了 `application/json` 或者 `500` 错误。

**原因**：`.env` 里没有配置 `SITE_URL`，或者值与实际域名不匹配。后端的 CORS 安全策略在生产环境下只允许 `SITE_URL` 指定的域名跨域请求，Vite 构建的 JS/CSS 标签带有 `crossorigin` 属性，浏览器会携带 `Origin` 头请求，被 CORS 拒绝。

**解决**：

```bash
# 1. 编辑 .env，确保 SITE_URL 配置正确
nano .env
# 修改为：SITE_URL=https://你的域名  （末尾不要加 /）

# 2. 重建容器
docker compose down
docker compose up -d --build

# 3. 验证 SITE_URL 是否传入容器
docker compose exec app printenv SITE_URL
# 应该输出 https://你的域名

# 4. 验证带 Origin 的请求是否正常
curl -sS -H "Origin: https://你的域名" https://你的域名/api/health
# 应该返回 {"ok":true,"db":"healthy"}
```

如果 `docker compose config` 报 `additional properties 'environment' not allowed`，说明你把 `environment:` 写到了 Compose 文件顶层，它必须在 `services → app` 下面，和 `ports`、`volumes` 同级缩进。

---

## 附录：完整命令速查表

| 你要做什么    | 命令                                                              |
| -------- | --------------------------------------------------------------- |
| 首次启动     | `docker compose up -d --build`                                  |
| 停止网站     | `docker compose down`                                           |
| 启动已停止的网站 | `docker compose up -d`                                          |
| 重启       | `docker compose restart`                                        |
| 查看运行状态   | `docker compose ps`                                             |
| 查看日志     | `docker compose logs -f app`                                    |
| 更新代码后重建  | `git pull && docker compose up -d --build`                      |
| 备份数据     | `tar -czf backup-$(date +%Y%m%d).tar.gz data/app.json uploads/` |
| 恢复数据     | `tar -xzf backup-xxxx.tar.gz && docker compose restart`         |
| 测试网站是否正常 | `curl http://localhost:3000/api/health`                         |

---

> 文档写于 2026-07-26。如果有不清晰的地方或遇到文档没覆盖的问题，随时反馈。
