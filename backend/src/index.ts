import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const app = express();
const requestedPort = Number(process.env.PORT || 3000);
const port = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3000;
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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));
const secureCookie = process.env.NODE_ENV === 'production';
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'nanyu-card-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: secureCookie,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/site-config', (_req, res) => {
  res.json(getSiteConfig());
});

app.get('/api/projects', (_req, res) => {
  res.json(listProjects());
});

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  if (verifyAdminPassword(username, password)) {
    (req.session as any).user = { username };
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: '用户名或密码错误' });
});

app.get('/api/admin/session', (req, res) => {
  res.json({ authenticated: Boolean((req.session as any).user) });
});

app.post('/api/admin/logout', (req, res) => {
  req.session.destroy(() => {
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
  if (!password || password.length < 4) {
    return res.status(400).json({ error: '密码至少需要 4 位' });
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
    fs.renameSync(req.file.path, destinationPath);
    return res.json({ url: `/uploads/${safeName}` });
  });
});

app.use('/uploads', express.static(uploadDir));

const frontendDist = path.resolve(__dirname, '..', '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if ((req.session as any).user) {
    return next();
  }
  return res.status(401).json({ error: '请先登录' });
}

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
}

startServer(port);
