import { computed, ref, nextTick } from 'vue'
import type { HighlightItem, SiteConfig } from '../types'
import { adminMessage } from './useToast'

export const DEFAULT_SITE: SiteConfig = {
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

export const site = ref<SiteConfig>({ ...DEFAULT_SITE, highlights: [...DEFAULT_SITE.highlights] })
export const draft = ref<SiteConfig>(JSON.parse(JSON.stringify(site.value)))
export const highlightDraft = ref<HighlightItem[]>([])
export const focusAreasText = ref('')
export const skillsText = ref('')

export const socialLinks = computed(() => {
  const links: Array<{ label: string; href: string }> = []
  if (site.value.github) links.push({ label: 'GitHub', href: site.value.github })
  if (site.value.telegram) links.push({ label: 'Telegram', href: site.value.telegram })
  if (site.value.email) links.push({ label: 'Email', href: `mailto:${site.value.email}` })
  return links
})

export const previewSite = computed(() => ({
  title: draft.value.site_name || '站点名称',
  description: draft.value.description || '请输入简介',
  about: draft.value.about || '请输入关于我内容',
  occupation: draft.value.occupation || '职业身份',
}))

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

export async function loadSiteData() {
  try {
    const [configRes, projectsRes] = await Promise.all([
      fetch('/api/site-config'),
      fetch('/api/projects'),
    ])
    if (!configRes.ok || !projectsRes.ok) throw new Error('加载数据失败')
    const config = await configRes.json()
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
    syncPageMeta()
    return { projects: await projectsRes.json() }
  } catch {
    adminMessage.value = '数据加载失败，请稍后重试'
    return { projects: [] }
  }
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

export function resetSiteDraft() {
  draft.value = JSON.parse(JSON.stringify(site.value))
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

export function clearAvatar() {
  draft.value.avatar = null
}
