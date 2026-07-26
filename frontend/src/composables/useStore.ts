import { computed, nextTick, reactive, ref, watch } from 'vue'
import type { HighlightItem, Project, SiteConfig } from '../types'

const DEFAULT_SITE: SiteConfig = {
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
  focus_areas: ['AI', '开源', '软件开发', '互联网产品'],
  skills: ['Vue / React', 'TypeScript', 'Node.js', '全栈开发', '产品设计', 'AI 工具'],
  highlights: [
    { period: '2024 — 现在', title: '持续探索 AI 与自研工具链', description: '建立可维护的个人数字作品入口，沉淀产品化流程与自动化经验。' },
    { period: '2023 — 2024', title: '沉淀前后端开发能力', description: '关注用户体验、接口设计、数据持久化与高效交付。' },
    { period: '早期', title: '从技术学习与项目实践中积累', description: '逐步形成对产品、设计与工程协作的整体理解。' },
  ],
}

// ---- reactive state (singleton, shared across views) ----
export const site = ref<SiteConfig>({ ...DEFAULT_SITE, highlights: [...DEFAULT_SITE.highlights] })
export const projects = ref<Project[]>([])
export const adminAuthenticated = ref(false)

export const loginForm = reactive({ username: 'admin', password: 'admin123' })
export const loginError = ref('')

// ---- admin draft state ----
export const draft = ref<SiteConfig>(JSON.parse(JSON.stringify(site.value)))
export const highlightDraft = ref<HighlightItem[]>([])
export const focusAreasText = ref('')
export const skillsText = ref('')
export const projectDraft = ref({ title: '', description: '', content: '', cover: '', url: '', github: '', tags: '', sort: 0 })
export const editingProjectId = ref<number | null>(null)
export const adminMessage = ref('')
export const toastText = ref('')
export const toastVisible = ref(false)

let toastTimer: ReturnType<typeof setTimeout> | null = null
watch(adminMessage, (msg) => {
  if (!msg) return
  toastText.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2800)
})

// ---- computed ----
export const socialLinks = computed(() => {
  const links: Array<{ label: string; href: string }> = []
  if (site.value.github) links.push({ label: 'GitHub', href: site.value.github })
  if (site.value.telegram) links.push({ label: 'Telegram', href: site.value.telegram })
  if (site.value.email) links.push({ label: 'Email', href: `mailto:${site.value.email}` })
  return links
})

export const stats = computed(() => ({
  projects: projects.value.length,
  skills: site.value.skills.length,
  highlights: site.value.highlights.length,
}))

export const previewSite = computed(() => ({
  title: draft.value.site_name || '站点名称',
  description: draft.value.description || '请输入简介',
  about: draft.value.about || '请输入关于我内容',
  occupation: draft.value.occupation || '职业身份',
}))

// ---- API helpers ----
export async function loadSiteData() {
  try {
    const [configRes, projectsRes] = await Promise.all([
      fetch('/api/site-config'),
      fetch('/api/projects'),
    ])
    if (!configRes.ok || !projectsRes.ok) throw new Error('加载数据失败')
    const config = await configRes.json()
    const list = await projectsRes.json()
    site.value = {
      ...site.value,
      ...config,
      focus_areas: Array.isArray(config.focus_areas) ? config.focus_areas : [],
      skills: Array.isArray(config.skills) ? config.skills : [],
      highlights: Array.isArray(config.highlights) ? config.highlights : [],
    }
    draft.value = JSON.parse(JSON.stringify(site.value))
    focusAreasText.value = site.value.focus_areas.join('、')
    skillsText.value = site.value.skills.join('、')
    highlightDraft.value = JSON.parse(JSON.stringify(site.value.highlights))
    projects.value = list
    syncPageMeta()
  } catch {
    adminMessage.value = '数据加载失败，请稍后重试'
  }
}

export function syncPageMeta() {
  document.title = site.value.site_name || 'Nanyu Card'
  let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'description')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', site.value.description || '个人数字名片')
}

export async function checkSession() {
  try {
    const res = await fetch('/api/admin/session')
    const data = await res.json()
    adminAuthenticated.value = Boolean(data.authenticated)
  } catch {
    adminAuthenticated.value = false
  }
}

export async function adminLogin() {
  loginError.value = ''
  const res = await fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: loginForm.username, password: loginForm.password }),
  })
  const data = await res.json()
  if (res.ok) {
    adminAuthenticated.value = true
    adminMessage.value = '登录成功'
    await loadSiteData()
    return true
  } else {
    loginError.value = data.error || '登录失败'
    return false
  }
}

export async function adminLogout() {
  await fetch('/api/admin/logout', { method: 'POST' })
  adminAuthenticated.value = false
  adminMessage.value = '已退出登录'
}

export async function saveSiteConfig() {
  const res = await fetch('/api/admin/site-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(draft.value),
  })
  const data = await res.json()
  if (res.ok) {
    site.value = {
      ...site.value,
      ...data,
      focus_areas: Array.isArray(data.focus_areas) ? data.focus_areas : site.value.focus_areas,
      skills: Array.isArray(data.skills) ? data.skills : site.value.skills,
      highlights: Array.isArray(data.highlights) ? data.highlights : site.value.highlights,
    }
    draft.value = JSON.parse(JSON.stringify(site.value))
    adminMessage.value = '站点信息已保存'
  } else {
    adminMessage.value = data.error || '保存失败'
  }
}

export async function saveHighlights() {
  const cleaned = highlightDraft.value
    .map((item) => ({
      period: (item.period || '').trim(),
      title: (item.title || '').trim(),
      description: (item.description || '').trim(),
    }))
    .filter((item) => item.period || item.title || item.description)
  const res = await fetch('/api/admin/site-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ highlights: cleaned }),
  })
  const data = await res.json()
  if (res.ok) {
    site.value.highlights = cleaned
    highlightDraft.value = JSON.parse(JSON.stringify(cleaned))
    adminMessage.value = '经历亮点已保存'
  } else {
    adminMessage.value = data.error || '保存失败'
  }
}

export async function saveTaxonomy() {
  const focusAreas = focusAreasText.value.split(/[、,\n]/).map((s) => s.trim()).filter(Boolean)
  const skills = skillsText.value.split(/[、,\n]/).map((s) => s.trim()).filter(Boolean)
  const res = await fetch('/api/admin/site-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ focus_areas: focusAreas, skills }),
  })
  const data = await res.json()
  if (res.ok) {
    site.value.focus_areas = focusAreas
    site.value.skills = skills
    adminMessage.value = '关注方向与技能已保存'
  } else {
    adminMessage.value = data.error || '保存失败'
  }
}

export function addHighlight() {
  highlightDraft.value.push({ period: '', title: '', description: '' })
  nextTick(() => {
    const items = document.querySelectorAll('.highlight-editor .form-row:first-child input')
    const last = items[items.length - 1] as HTMLInputElement | undefined
    last?.focus()
  })
}

export function removeHighlight(index: number) {
  highlightDraft.value.splice(index, 1)
}

export function moveHighlight(index: number, delta: number) {
  const target = index + delta
  if (target < 0 || target >= highlightDraft.value.length) return
  const [item] = highlightDraft.value.splice(index, 1)
  highlightDraft.value.splice(target, 0, item)
}

export async function saveProject() {
  if (!projectDraft.value.title.trim()) {
    adminMessage.value = '请填写项目标题'
    return
  }
  const payload = {
    title: projectDraft.value.title,
    description: projectDraft.value.description,
    content: projectDraft.value.content,
    cover: projectDraft.value.cover || null,
    url: projectDraft.value.url,
    github: projectDraft.value.github,
    tags: projectDraft.value.tags.split(',').map((s) => s.trim()).filter(Boolean),
    sort: Number(projectDraft.value.sort) || 0,
  }
  const res = editingProjectId.value
    ? await fetch(`/api/admin/projects/${editingProjectId.value}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    : await fetch('/api/admin/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  const data = await res.json()
  if (res.ok) {
    resetProjectDraft()
    await loadSiteData()
    adminMessage.value = '项目已保存'
  } else {
    adminMessage.value = data.error || '保存失败'
  }
}

export function editProject(project: Project) {
  editingProjectId.value = project.id
  projectDraft.value = {
    title: project.title,
    description: project.description,
    content: project.content || '',
    cover: project.cover || '',
    url: project.url || '',
    github: project.github || '',
    tags: project.tags.join(','),
    sort: project.sort,
  }
}

export function resetProjectDraft() {
  projectDraft.value = { title: '', description: '', content: '', cover: '', url: '', github: '', tags: '', sort: 0 }
  editingProjectId.value = null
}

export async function deleteProject(id: number) {
  const project = projects.value.find((p) => p.id === id)
  if (!window.confirm(`确认删除「${project?.title || '该项目'}」？此操作不可撤销。`)) return
  const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
  if (res.ok) {
    await loadSiteData()
    adminMessage.value = '项目已删除'
  }
}

export async function uploadImage(target: 'avatar' | 'cover', event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  adminMessage.value = '图片上传中...'
  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (res.ok) {
    if (target === 'avatar') {
      draft.value.avatar = data.url
      site.value.avatar = data.url
    } else {
      projectDraft.value.cover = data.url
    }
    adminMessage.value = '图片已上传'
  } else {
    adminMessage.value = data.error || '上传失败'
  }
  input.value = ''
}

export function clearAvatar() {
  if (!window.confirm('确认清除当前头像？')) return
  draft.value.avatar = null
}

export async function changePassword() {
  const newPassword = window.prompt('请输入新密码（至少 4 位）')
  if (!newPassword) return
  const res = await fetch('/api/admin/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) })
  const data = await res.json()
  if (res.ok) {
    adminMessage.value = '密码已修改'
  } else {
    adminMessage.value = data.error || '修改失败'
  }
}

export function resetSiteDraft() {
  draft.value = JSON.parse(JSON.stringify(site.value))
}
