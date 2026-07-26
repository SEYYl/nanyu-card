<script setup lang="ts">
import { useRouter } from 'vue-router'
import { confirmDialog } from '../../composables/useDialog'
import { projects, deleteProject, editProject } from '../../composables/useProjects'

const router = useRouter()

function handleEdit(project: typeof projects.value[0]) {
  editProject(project)
  router.push(`/admin/projects/${project.id}`)
}

async function handleDelete(id: number) {
  const project = projects.value.find((p) => p.id === id)
  const ok = await confirmDialog('确认删除', `确认删除「${project?.title || '该项目'}」？此操作不可撤销。`)
  if (ok) {
    await deleteProject(id, project?.title || '')
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>项目管理</h2>
      <button @click="router.push('/admin/projects/new')">新增项目</button>
    </div>

    <div class="card" style="overflow: hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th>项目名称</th>
            <th>标签</th>
            <th>排序</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!projects.length">
            <td colspan="4" class="empty-row">还没有项目，点击右上角「新增项目」开始添加。</td>
          </tr>
          <tr v-for="project in projects" :key="project.id">
            <td style="color: var(--text-primary); font-weight: 500;">{{ project.title }}</td>
            <td>
              <span v-for="t in project.tags.slice(0, 3)" :key="t" class="badge" style="margin-right: 4px;">{{ t }}</span>
              <span v-if="project.tags.length > 3" class="muted" style="font-size: 0.78rem;">+{{ project.tags.length - 3 }}</span>
            </td>
            <td>{{ project.sort }}</td>
            <td>
              <div class="table-actions">
                <button class="secondary" @click="handleEdit(project)">编辑</button>
                <button class="secondary danger" @click="handleDelete(project.id)">删除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
