# Nanyu Card 后端代码审查报告

> **审查范围**: `backend/src/index.ts`, `backend/src/db.ts`, `Dockerfile`, `docker-compose.yml`, `.env`, `.env.example`
> **代码总量**: ~500 行 TypeScript | **技术栈**: Express 4 + TypeScript + JSON 文件存储
> **状态**: ✅ 已修复 P0、P1、P2 共 10 项问题

## 🟢 已修复清单

| # | 严重度 | 问题 | 修复内容 |
|---|--------|------|----------|
| 1 | ✅ P0 | 默认密码硬编码 | `crypto.randomBytes(12)` 随机生成，控制台打印 |
| 2 | ✅ P0 | SESSION_SECRET 暴露在 compose | 改用 `${SESSION_SECRET}` 引用环境变量 |
| 3 | ✅ P0 | updateProject 无字段白名单 | `ALLOWED_PROJECT_FIELDS` 白名单过滤 |
| 4 | ✅ P1 | 缺少 Helmet 安全头 | 安装 helmet + CSP 配置 |
| 5 | ✅ P1 | 登录接口无速率限制 | 登录 15min/10次，全局 API 15min/500次 |
| 6 | ✅ P1 | CORS origin: true 过于宽松 | 生产环境白名单，开发环境保持宽松 |
| 7 | ✅ P1 | 密码最小长度 4 位 | 改为 8 位 |
| 8 | ✅ P1 | req.session as any 类型逃逸 | 新增 `express-session.d.ts` 类型扩展 |
| 9 | ✅ P1 | 文件上传 renameSync 无错误处理 | try-catch + 临时文件清理 |
| 10 | ✅ P2 | writeFileSync 阻塞 + 缺并发保护 | setImmediate 批量写入锁 |
| 11 | ✅ P2 | 缺优雅关机 | SIGTERM/SIGINT 处理 + 超时强制退出 |
| 12 | ✅ P2 | 健康检查不深入 | 增加 `db` 字段检查数据文件可读性 |
| 13 | ✅ P2 | logout 残缺 | 增加 `res.clearCookie('connect.sid')` |
| 14 | ✅ P2 | 缺全局错误处理 | 添加 Express error handler |

### 保留的 P3 项（低优先级）
- 零测试覆盖
- 路由未拆分为 Router（当前代码量可控）
- 缺少结构化日志（console 够用）
- `@types/express` 版本不匹配

---

## 📊 总体评价

架构简洁、功能完备——2 个源文件就搞定了完整的 REST API + 认证 + 文件上传 + 数据持久化。对于个人主页这种低并发、低数据量场景，**JSON 文件存储**是完全合适的选型。但安全性和代码健壮性方面有几个必须关注的问题。

---

## 🔴 P0 — 安全隐患（必须修复）

### 1. 默认密码硬编码 + Session Secret 暴露在 compose 文件中

**问题位置**: `db.ts:220` & `docker-compose.yml:13`

```typescript
// db.ts - 默认密码 admin123 硬编码
password_hash: bcrypt.hashSync('admin123', 10),
```

```yaml
# docker-compose.yml - SESSION_SECRET 硬编码
SESSION_SECRET: nanyu-card-secret
```

**风险**:
- 代码仓库中硬编码默认密码，任何有代码访问权限的人都知道初始密码
- compose 文件中的 `nanyu-card-secret` 会**覆盖** `.env` 里的生产密钥（compose 的 `environment` 优先级高于 env_file）
- 即使你改了 `.env` 里的 `SESSION_SECRET`，compose 仍然使用硬编码值

**修复方案**:

1. `docker-compose.yml` 中改用 `env_file` 或引用变量：
```yaml
environment:
  SESSION_SECRET: ${SESSION_SECRET}  # 从宿主环境变量读取
```

2. `db.ts` 中首次启动时生成随机密码并打印到控制台：
```typescript
function createAdminUser(): StoredUser {
  const defaultPassword = crypto.randomBytes(12).toString('hex');
  console.log(`[INIT] 默认管理员密码: ${defaultPassword} (请登录后立即修改)`);
  return {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync(defaultPassword, 10),
    created_at: new Date().toISOString(),
  };
}
```

3. **检查 `.env` 是否已被提交到 Git**：
```bash
git log --all --full-history -- .env
```
如果已经被提交过，需要立即更换所有密钥（SESSION_SECRET 等）。

---

### 2. `updateProject` 无字段白名单 — 可注入任意字段

**问题位置**: `index.ts:106-123` & `db.ts:282-292`

```typescript
// index.ts - 直接将 req.body 原样传给 updateProject
const payload = req.body as Record<string, unknown>;
const updated = updateProject(projectId, {
  title: payload.title ? String(payload.title) : undefined,
  cover: payload.cover ? String(payload.cover) : undefined,
  // ... 看似有字段过滤
});

// db.ts - Object.assign 会把 payload 里所有字段直接合并进去
Object.assign(existing, {
  ...existing,
  ...input,       // ⚠️ input 可能含有关键字段
  tags: input.tags ?? existing.tags,
});
```

**风险**:
- 虽然 index.ts 里看似做了字段映射，但如果恶意用户绕过前端直接调用 API，传入 `{ "id": 999, "created_at": "hacked" }`，`input.id` 和 `input.created_at` 会被 `Object.assign` 合并到 existing 对象
- 当前的字段映射只是**选择性地覆盖了部分字段**，但没有**排除**不应该被修改的字段

**修复方案** — 在 `db.ts` 的 `updateProject` 中做白名单过滤：

```typescript
export function updateProject(id: number, input: Partial<ProjectItem>): ProjectItem | null {
  const existing = state.projects.find((item) => item.id === id);
  if (!existing) return null;

  // 白名单：只允许更新这些字段
  const allowedFields = ['title', 'cover', 'description', 'content', 'url', 'github', 'tags', 'sort'] as const;
  for (const key of allowedFields) {
    if (key in input) {
      (existing as any)[key] = input[key];
    }
  }

  saveState(state);
  return existing;
}
```

---

## 🟠 P1 — 高风险项（强烈建议修复）

### 3. 缺少安全头 (Helmet)

**问题**: 没有使用 `helmet` 中间件，缺少以下关键安全头：
- `Content-Security-Policy` — 防止 XSS
- `X-Frame-Options` — 防止点击劫持
- `X-Content-Type-Options` — 防止 MIME 嗅探
- `Strict-Transport-Security` — 强制 HTTPS

**修复**: `npm install helmet`，然后添加：
```typescript
import helmet from 'helmet';
app.use(helmet());
```

---

### 4. 登录接口缺少速率限制

**问题位置**: `index.ts:65-75`

`POST /api/admin/login` 没有任何速率限制，攻击者可以无限尝试用户名/密码组合进行暴力破解。

**修复**:
```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 分钟
  max: 10,                     // 最多 10 次
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.post('/api/admin/login', loginLimiter, (req, res) => { ... });
```

---

### 5. CORS 配置过于宽松

**问题位置**: `index.ts:38`

```typescript
app.use(cors({ origin: true, credentials: true }));
```

`origin: true` 意味着**任何网站**都可以携带 Cookie 向你的 API 发起跨域请求。配合 `credentials: true`，意味着任何第三方网站都可以利用已登录用户的 session。

**修复**: 至少限制为前端域名：
```typescript
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://your-domain.com']
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

---

### 6. 密码最小长度只有 4 位

**问题位置**: `index.ts:135`

```typescript
if (!password || password.length < 4) {
```

4 位密码太容易暴力破解。

**修复**: 改为至少 8 位，建议 12 位以上：
```typescript
if (!password || password.length < 8) {
  return res.status(400).json({ error: '密码至少需要 8 位' });
}
```

---

### 7. TypeScript 类型安全性丢失

**问题位置**: 全局多处

```typescript
(req.session as any).user          // index.ts:71, 78, 168
const data = req.body as Record<string, unknown>;  // index.ts:88
```

整个 session 和 request body 完全放弃了 TypeScript 的类型检查。

**修复**: 声明 session 类型扩展：
```typescript
// types/express-session.d.ts
import 'express-session';

declare module 'express-session' {
  interface SessionData {
    user?: { username: string };
  }
}
```

然后就可以直接写 `req.session.user` 了，不需要 `as any`。

---

### 8. 文件上传 rename 缺少错误处理

**问题位置**: `index.ts:152-153`

```typescript
fs.renameSync(req.file.path, destinationPath);
```

使用 `renameSync` 同步方法会阻塞事件循环。而且如果 rename 失败（比如跨分区），没有错误处理。

**修复**:
```typescript
try {
  await fs.promises.rename(req.file.path, destinationPath);
} catch (err) {
  // 清理 multer 生成的临时文件
  fs.unlink(req.file.path, () => {});
  return res.status(500).json({ error: '文件保存失败' });
}
```

---

## 🟡 P2 — 中优先级（建议优化）

### 9. JSON 文件写入使用同步方法阻塞事件循环

**问题位置**: `db.ts:214`

```typescript
fs.writeFileSync(dbPath, JSON.stringify(nextState, null, 2));
```

- `writeFileSync` 会阻塞 Node.js 事件循环
- 虽然当前数据量很小，但这是不好的实践

**修复**: 改用异步写入：
```typescript
async function saveState(nextState: StoredState): Promise<void> {
  state = nextState;
  try {
    await fs.promises.writeFile(dbPath, JSON.stringify(nextState, null, 2));
  } catch (err) {
    console.error('[DB] 数据写入失败:', err);
  }
}
```

如果改成异步，所有调用 `saveState` 的函数也需要改成 async（这会是较大改动）。折中方案：使用 `fs.writeFile` 回调版本 + 错误日志。

---

### 10. 路由建议拆分为 Router

**问题**: `index.ts` 约 190 行，所有路由都塞在一个文件里。虽然目前功能不多，但随着增长会越来越难维护。

**修复**: 抽取路由模块：
```
src/
├── index.ts          # 入口：app 配置 + 启动
├── routes/
│   ├── public.ts     # /api/health, /api/site-config, /api/projects
│   └── admin.ts      # /api/admin/*
├── middleware/
│   ├── auth.ts       # requireAuth
│   └── upload.ts     # multer 配置
└── db.ts
```

---

### 11. 缺少结构化日志

**问题**: 所有日志都用 `console.log/error/warn`，没有时间戳、没有日志级别、没有请求追踪。

**修复**: 可以使用轻量方案如 `pino`，或简单包装：
```typescript
function log(level: string, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  console[level](JSON.stringify({ timestamp, level, message, ...meta }));
}
```

---

### 12. JSON 文件存储缺乏并发保护

**问题**: 如果两个请求同时修改数据（比如同时创建项目），可能出现：
1. 请求 A 读 state → 请求 B 读 state → 请求 A 写文件 → 请求 B 写文件（覆盖 A 的修改）

这会导致数据丢失。

**修复**: 添加简单的写锁：
```typescript
let writePromise: Promise<void> = Promise.resolve();

function saveState(nextState: StoredState): void {
  state = nextState;
  writePromise = writePromise.then(() =>
    fs.promises.writeFile(dbPath, JSON.stringify(nextState, null, 2))
  );
}
```

---

### 13. `@types/express` 版本不匹配

**问题**: `package.json` 中 `@types/express` 是 `^5.0.0`，但实际使用的是 Express 4.x (`^4.21.2`)。

Express 5 的类型定义与 Express 4 不完全兼容，某些 API 可能有类型差异。

**修复**: 降级类型定义，或确保类型兼容：
```json
"@types/express": "^4.17.21"
```

---

## 🟢 P3 — 低优先级（锦上添花）

### 14. 零测试覆盖

项目没有任何自动化测试。考虑到代码量不大，可以加一些关键路径的集成测试：

```typescript
// 建议用 vitest + supertest 覆盖：
// - 健康检查返回 200
// - 未登录访问 /api/admin/* 返回 401
// - 登录成功/失败场景
// - 项目 CRUD 完整流程
```

### 15. 健康检查不够深入

`/api/health` 只返回 `{ ok: true }`，没有检查数据文件是否可读。

### 16. 缺少优雅关机

没有 `SIGTERM` / `SIGINT` 处理，Docker 容器停止时可能还在处理请求。

---

## 📋 改进清单汇总

| # | 严重度 | 问题 | 影响 |
|---|--------|------|------|
| 1 | 🔴 P0 | 默认密码硬编码 + SESSION_SECRET 暴露在 compose | 安全 |
| 2 | 🔴 P0 | `updateProject` 无字段白名单 | 数据完整性 |
| 3 | 🟠 P1 | 缺少 Helmet 安全头 | 安全 |
| 4 | 🟠 P1 | 登录接口无速率限制 | 安全 |
| 5 | 🟠 P1 | CORS `origin: true` 过于宽松 | 安全 |
| 6 | 🟠 P1 | 密码最小长度 4 位 | 安全 |
| 7 | 🟠 P1 | `req.session as any` 遍地开花 | 代码质量 |
| 8 | 🟠 P1 | 文件上传 `renameSync` 无错误处理 | 健壮性 |
| 9 | 🟡 P2 | `writeFileSync` 阻塞事件循环 | 性能 |
| 10 | 🟡 P2 | 路由未拆分 Router | 可维护性 |
| 11 | 🟡 P2 | 缺少结构化日志 | 可观测性 |
| 12 | 🟡 P2 | JSON 文件存储缺乏并发保护 | 数据安全 |
| 13 | 🟡 P2 | `@types/express` 版本不匹配 | 类型安全 |
| 14 | 🟢 P3 | 零测试覆盖 | 质量保障 |
| 15 | 🟢 P3 | 健康检查不深入 | 可观测性 |
| 16 | 🟢 P3 | 缺少优雅关机 | 可靠性 |

---

## ✅ 做得好的地方

别只看问题，以下设计值得肯定：

1. **端口自动回退** — 端口被占用时自动尝试 `port + 1`，比直接崩溃好得多
2. **密码使用 bcryptjs** — 选对了加密库，散列强度 10 是合适的
3. **Session 配置合理** — `httpOnly + sameSite: 'lax' + secure(生产) + maxAge` 都设对了
4. **Multer 文件类型过滤** — 限制了只允许 `image/*`
5. **JSON 格式化的持久化** — `JSON.stringify(null, 2)` 方便人工查看和调试
6. **向后兼容的 `parseTags`** — 能处理数组和逗号分隔字符串两种格式
7. **Docker 一键部署** — compose 文件配置清晰，volume 持久化了数据

---

> **总体结论**: 后端代码质量在个人项目这个量级上是**够用的**。P0 级别的 2 个安全问题需要优先处理，P1 的建议修复能显著提升安全性。架构层面，JSON 文件存储对于个人主页是合适的选择，不需要过度设计引入数据库。
