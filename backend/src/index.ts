import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer, { type FileFilterCallback } from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createProject,
  deleteProject,
  getSiteConfig,
  listProjects,
  updateAdminPassword,
  updateProject,
  upsertSiteConfig,
  verifyAdminPassword,
} from './db.js';

// ---- 路径初始化 ----
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

// ---- Multer 配置 ----
const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

// ---- Express 初始化 ----
const app = express();
app.set('trust proxy', 1); // 信任 Cloudflare / Nginx 反向代理的第一层
const requestedPort = Number(process.env.PORT || 3000);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3000;
const isProduction = process.env.NODE_ENV === 'production';

// ---- 安全中间件 ----
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      connectSrc: ["'self'"],
    },
  },
}));

// ---- CORS ----
app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        // 生产环境只允许本站请求；未设置 origin（同源请求）也放行
        if (!origin) return callback(null, true);
        // 根据实际部署域名调整
        const allowed = [
          process.env.SITE_URL || '',
        ].filter(Boolean);
        if (allowed.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // 开发环境宽松
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// ---- Session ----
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'nanyu-card-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: 'auto', // 自动根据 X-Forwarded-Proto 判断，兼容 Cloudflare 各种 SSL 模式
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 天
    },
  }),
);

// ---- 登录速率限制 ----
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: process.env.NODE_ENV === 'production' ? 10 : 999,
  message: { error: '登录尝试过于频繁，请 15 分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ---- 全局 API 速率限制 ----
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ===== 公开接口 =====

app.get('/api/health', (_req, res) => {
  const dbOk = fs.existsSync(
    process.env.DB_PATH || path.resolve(__dirname, '..', 'data', 'app.json'),
  );
  res.json({ ok: true, db: dbOk ? 'healthy' : 'unreachable' });
});

app.get('/api/site-config', (_req, res) => {
  res.json(getSiteConfig());
});

app.get('/api/projects', (_req, res) => {
  res.json(listProjects());
});

// ===== 管理后台接口 =====

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (verifyAdminPassword(username, password)) {
    req.session.user = { username };
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: '用户名或密码错误' });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: Boolean(req.session.user) });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
});

app.post('/api/admin/site-config', requireAuth, (req, res) => {
  const data = req.body as Record<string, unknown>;
  res.json(upsertSiteConfig(data));
});

app.post('/api/admin/projects', requireAuth, (req, res) => {
  const payload = req.body as Record<string, unknown>;
  res.json(createProject({
    title: String(payload.title || ''),
    cover: payload.cover ? String(payload.cover) : null,
    description: String(payload.description || ''),
    content: payload.content ? String(payload.content) : null,
    url: payload.url ? String(payload.url) : null,
    github: payload.github ? String(payload.github) : null,
    tags: Array.isArray(payload.tags) ? payload.tags.map((item) => String(item)) : [],
    sort: Number(payload.sort || 0),
  }));
});

app.put('/api/admin/projects/:id', requireAuth, (req, res) => {
  const projectId = Number(req.params.id);
  const payload = req.body as Record<string, unknown>;
  const updated = updateProject(projectId, {
    title: payload.title ? String(payload.title) : undefined,
    cover: payload.cover ? String(payload.cover) : undefined,
    description: payload.description ? String(payload.description) : undefined,
    content: payload.content ? String(payload.content) : undefined,
    url: payload.url ? String(payload.url) : undefined,
    github: payload.github ? String(payload.github) : undefined,
    tags: Array.isArray(payload.tags) ? payload.tags.map((item) => String(item)) : undefined,
    sort: payload.sort !== undefined ? Number(payload.sort) : undefined,
  });
  if (!updated) {
    return res.status(404).json({ error: '项目不存在' });
  }
  return res.json(updated);
});

app.delete('/api/admin/projects/:id', requireAuth, (req, res) => {
  const projectId = Number(req.params.id);
  if (deleteProject(projectId)) {
    return res.json({ ok: true });
  }
  return res.status(404).json({ error: '项目不存在' });
});

app.post('/api/admin/password', requireAuth, (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 8) {
    return res.status(400).json({ error: '密码至少需要 8 位' });
  }
  updateAdminPassword(password);
  return res.json({ ok: true });
});

app.post('/api/admin/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: error.message || '上传失败' });
    }
    if (!req.file) {
      return res.status(400).json({ error: '请选择要上传的图片' });
    }

    const ext = path.extname(req.file.originalname || '').toLowerCase();
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext || '.png'}`;
    const destinationPath = path.join(uploadDir, safeName);

    try {
      fs.renameSync(req.file.path, destinationPath);
    } catch (err) {
      // 清理 multer 临时文件
      fs.unlink(req.file.path, () => {});
      return res.status(500).json({ error: '文件保存失败，请重试' });
    }

    return res.json({ url: `/uploads/${safeName}` });
  });
});

// ---- 静态资源 ----
app.use('/uploads', express.static(uploadDir));

const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// ---- 认证中间件 ----
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ error: '请先登录' });
}

// ---- 全局错误处理 ----
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

// ---- 服务器启动 & 优雅关机 ----
function startServer(listenPort: number) {
  const server = app.listen(listenPort, () => {
    console.log(`Server listening on http://localhost:${listenPort}`);
  });

  server.on('error', (error: NodeJS.ErrnoException) => {
    if (error.code === 'EADDRINUSE') {
      const fallbackPort = listenPort + 1;
      console.warn(`Port ${listenPort} is busy, trying ${fallbackPort}...`);
      startServer(fallbackPort);
      return;
    }
    console.error(error);
    process.exit(1);
  });

  // 优雅关机
  const shutdown = (signal: string) => {
    console.log(`\n收到 ${signal} 信号，正在关闭服务器...`);
    server.close(() => {
      console.log('服务器已关闭');
      process.exit(0);
    });
    // 超时强制退出
    setTimeout(() => {
      console.error('强制退出（超时）');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer(port);
