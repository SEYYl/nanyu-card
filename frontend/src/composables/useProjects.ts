import { ref } from 'vue'
import type { Project } from '../types'
import { adminMessage } from './useToast'
import { site, loadSiteData } from './useSite'

export const projects = ref<Project[]>([])
export const projectDraft = ref({ title: '', description: '', content: '', cover: '', url: '', github: '', tags: '', sort: 0 })
export const editingProjectId = ref<number | null>(null)

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
    const result = await loadSiteData()
    projects.value = result.projects
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

export async function deleteProject(id: number, projectTitle: string) {
  const res = await fetch(`/api/admin/projects/${id}`, { method: 'DELETE' })
  if (res.ok) {
    projects.value = projects.value.filter((p) => p.id !== id)
    adminMessage.value = `项目「${projectTitle}」已删除`
  }
}

/** 站点统计（需要在 site 可用时调用） */
export function getStats() {
  return {
    projects: projects.value.length,
    skills: site.value.skills.length,
    highlights: site.value.highlights.length,
  }
}
