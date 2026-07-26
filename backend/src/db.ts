import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'app.json');

interface StoredUser {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
}

export interface HighlightItem {
  period: string;
  title: string;
  description: string;
}

export interface SiteConfig {
  id: number;
  site_name: string;
  avatar: string | null;
  description: string;
  about: string;
  occupation: string;
  email: string | null;
  github: string | null;
  telegram: string | null;
  icp: string | null;
  police: string | null;
  focus_areas: string[];
  skills: string[];
  highlights: HighlightItem[];
  updated_at: string;
}

export interface ProjectItem {
  id: number;
  title: string;
  cover: string | null;
  description: string;
  content: string | null;
  url: string | null;
  github: string | null;
  tags: string[];
  sort: number;
  created_at: string;
}

interface StoredState {
  users: StoredUser[];
  siteConfig: SiteConfig;
  projects: ProjectItem[];
  nextProjectId: number;
  nextUserId: number;
}

const defaultFocusAreas = ['AI', '开源', '软件开发', '互联网产品'];

const defaultSkills = ['Vue / React', 'TypeScript', 'Node.js', '全栈开发', '产品设计', 'AI 工具'];

const defaultHighlights: HighlightItem[] = [
  {
    period: '2024 — 现在',
    title: '持续探索 AI 与自研工具链',
    description: '建立可维护的个人数字作品入口，沉淀产品化流程与自动化经验。',
  },
  {
    period: '2023 — 2024',
    title: '沉淀前后端开发能力',
    description: '关注用户体验、接口设计、数据持久化与高效交付。',
  },
  {
    period: '早期',
    title: '从技术学习与项目实践中积累',
    description: '逐步形成对产品、设计与工程协作的整体理解。',
  },
];

const defaultSiteConfig: SiteConfig = {
  id: 1,
  site_name: 'Nanyu Card',
  avatar: null,
  description: '独立开发者 / AI 探索者',
  about: '这里是一个简洁、现代的个人主页入口，适合展示个人介绍、项目经历和联系方式。',
  occupation: '独立开发者',
  email: null,
  github: null,
  telegram: null,
  icp: null,
  police: null,
  focus_areas: defaultFocusAreas,
  skills: defaultSkills,
  highlights: defaultHighlights,
  updated_at: new Date().toISOString(),
};

const defaultProjects: ProjectItem[] = [
  {
    id: 1,
    title: '个人主页系统',
    cover: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    description: '一个可持续更新的数字名片与项目展示系统。',
    content: '支持后台管理、项目内容编辑和部署。',
    url: 'https://example.com',
    github: 'https://github.com',
    tags: ['Vue', 'Node.js', '全栈'],
    sort: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'AI 助手原型',
    cover: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=80',
    description: '探索 AI 与产品化流程的轻量原型。',
    content: '专注于提示词、自动化流程与基础交互体验。',
    url: null,
    github: null,
    tags: ['AI', '产品'],
    sort: 2,
    created_at: new Date().toISOString(),
  },
];

let state: StoredState;

function normalizeStringArray(input: unknown, fallback: string[]): string[] {
  if (Array.isArray(input)) {
    return input.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof input === 'string') {
    return input
      .split(/[\n,]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return fallback;
}

function normalizeHighlights(input: unknown, fallback: HighlightItem[]): HighlightItem[] {
  if (!Array.isArray(input)) return fallback;
  const result: HighlightItem[] = [];
  for (const item of input) {
    if (!item || typeof item !== 'object') continue;
    const entry = item as Record<string, unknown>;
    const period = String(entry.period || '').trim();
    const title = String(entry.title || '').trim();
    const description = String(entry.description || '').trim();
    if (!period && !title && !description) continue;
    result.push({ period, title, description });
  }
  return result.length > 0 ? result : fallback;
}

function loadState(): StoredState {
  if (!fs.existsSync(dbPath)) {
    const initialState: StoredState = {
      users: [createAdminUser()],
      siteConfig: defaultSiteConfig,
      projects: defaultProjects,
      nextProjectId: 3,
      nextUserId: 2,
    };
    saveState(initialState);
    return initialState;
  }

  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    const stored = (parsed.siteConfig || {}) as Record<string, unknown>;
    const normalized: StoredState = {
      users: Array.isArray(parsed.users) ? parsed.users : [createAdminUser()],
      siteConfig: {
        ...defaultSiteConfig,
        ...stored,
        id: 1,
        focus_areas: normalizeStringArray(stored.focus_areas, defaultSiteConfig.focus_areas),
        skills: normalizeStringArray(stored.skills, defaultSiteConfig.skills),
        highlights: normalizeHighlights(stored.highlights, defaultSiteConfig.highlights),
        updated_at: typeof stored.updated_at === 'string' ? stored.updated_at : defaultSiteConfig.updated_at,
      },
      projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : defaultProjects,
      nextProjectId: typeof parsed.nextProjectId === 'number' ? parsed.nextProjectId : 3,
      nextUserId: typeof parsed.nextUserId === 'number' ? parsed.nextUserId : 2,
    };
    if (!normalized.users.some((user) => user.username === 'admin')) {
      normalized.users.unshift(createAdminUser());
      normalized.nextUserId += 1;
    }
    saveState(normalized);
    return normalized;
  } catch {
    const fallback: StoredState = {
      users: [createAdminUser()],
      siteConfig: defaultSiteConfig,
      projects: defaultProjects,
      nextProjectId: 3,
      nextUserId: 2,
    };
    saveState(fallback);
    return fallback;
  }
}

let writeScheduled = false;

function saveState(nextState: StoredState): void {
  state = nextState;
  if (!writeScheduled) {
    writeScheduled = true;
    setImmediate(() => {
      writeScheduled = false;
      try {
        fs.writeFileSync(dbPath, JSON.stringify(state, null, 2));
      } catch (err) {
        console.error('[DB] 数据写入失败:', err);
      }
    });
  }
}

function createAdminUser(): StoredUser {
  const defaultPassword = crypto.randomBytes(12).toString('hex');
  console.log(`\n========================================`);
  console.log(`  初始管理员密码: ${defaultPassword}`);
  console.log(`  请登录后台后立即修改密码`);
  console.log(`========================================\n`);
  return {
    id: 1,
    username: 'admin',
    password_hash: bcrypt.hashSync(defaultPassword, 10),
    created_at: new Date().toISOString(),
  };
}

export function getSiteConfig(): SiteConfig {
  return state.siteConfig;
}

export function upsertSiteConfig(input: Partial<SiteConfig>): SiteConfig {
  state.siteConfig = {
    ...state.siteConfig,
    ...input,
    id: 1,
    focus_areas: normalizeStringArray(input.focus_areas, state.siteConfig.focus_areas),
    skills: normalizeStringArray(input.skills, state.siteConfig.skills),
    highlights: normalizeHighlights(input.highlights, state.siteConfig.highlights),
    updated_at: new Date().toISOString(),
  };
  saveState(state);
  return state.siteConfig;
}

export function verifyAdminPassword(username: string, password: string): boolean {
  const user = state.users.find((entry) => entry.username === username);
  if (!user) return false;
  return bcrypt.compareSync(password, user.password_hash);
}

export function updateAdminPassword(newPassword: string): void {
  const user = state.users.find((entry) => entry.username === 'admin');
  if (!user) return;
  user.password_hash = bcrypt.hashSync(newPassword, 10);
  saveState(state);
}

export function listProjects(): ProjectItem[] {
  return [...state.projects]
    .sort((a, b) => a.sort - b.sort || new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((item) => ({ ...item, tags: Array.isArray(item.tags) ? item.tags : parseTags(item.tags as string) }));
}

export function createProject(input: Omit<ProjectItem, 'id' | 'created_at' | 'tags'> & { tags?: string[] }): ProjectItem {
  const project: ProjectItem = {
    id: state.nextProjectId,
    title: input.title,
    cover: input.cover ?? null,
    description: input.description,
    content: input.content ?? null,
    url: input.url ?? null,
    github: input.github ?? null,
    tags: input.tags ?? [],
    sort: input.sort ?? 0,
    created_at: new Date().toISOString(),
  };
  state.projects.push(project);
  state.nextProjectId += 1;
  saveState(state);
  return project;
}

const ALLOWED_PROJECT_FIELDS = ['title', 'cover', 'description', 'content', 'url', 'github', 'tags', 'sort'] as const;

type AllowedProjectField = (typeof ALLOWED_PROJECT_FIELDS)[number];

export function updateProject(id: number, input: Partial<Record<AllowedProjectField | 'id' | 'created_at', unknown>>): ProjectItem | null {
  const existing = state.projects.find((item) => item.id === id);
  if (!existing) return null;

  for (const key of ALLOWED_PROJECT_FIELDS) {
    if (key in input) {
      (existing as unknown as Record<string, unknown>)[key] = input[key];
    }
  }

  saveState(state);
  return existing;
}

export function deleteProject(id: number): boolean {
  const before = state.projects.length;
  state.projects = state.projects.filter((item) => item.id !== id);
  saveState(state);
  return state.projects.length !== before;
}

function parseTags(raw: string | string[] | null | undefined): string[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

state = loadState();