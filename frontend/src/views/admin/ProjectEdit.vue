<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  projects, projectDraft, editingProjectId,
  saveProject, resetProjectDraft, editProject,
} from '../../composables/useProjects'

const router = useRouter()
const route = useRoute()
const isNew = route.params.id === 'new'
const projectId = isNew ? null : Number(route.params.id)
const saving = ref(false)

onMounted(() => {
  if (projectId) {
    const project = projects.value.find((p) => p.id === projectId)
    if (project) {
      editProject(project)
    } else {
      router.replace('/admin/projects')
    }
  }
})

async function handleSave() {
  if (saving.value) return  // 防抖：防止重复点击
  saving.value = true
  try {
    await saveProject()
    if (!editingProjectId.value) {
      router.push('/admin/projects')
    }
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  resetProjectDraft()
  router.push('/admin/projects')
}
</script>

<template>
  <div class="project-edit-form">
    <router-link to="/admin/projects" class="back-link">← 返回项目列表</router-link>

    <div class="page-header">
      <h2>{{ isNew ? '新增项目' : '编辑项目' }}</h2>
    </div>

    <div class="card panel">
      <div class="form-row">
        <label>项目标题</label>
        <input v-model="projectDraft.title" placeholder="项目名称" />
      </div>
      <div class="form-row">
        <label>简介</label>
        <textarea v-model="projectDraft.description" rows="3" placeholder="一句话介绍这个项目" />
      </div>
      <div class="form-row">
        <label>详细介绍</label>
        <textarea v-model="projectDraft.content" rows="4" placeholder="更详细的描述" />
      </div>
      <div class="form-row two-col">
        <div>
          <label>项目链接</label>
          <input v-model="projectDraft.url" placeholder="https://..." />
        </div>
        <div>
          <label>GitHub 链接</label>
          <input v-model="projectDraft.github" placeholder="https://github.com/..." />
        </div>
      </div>
      <div class="form-row two-col">
        <div>
          <label>标签（逗号分隔）</label>
          <input v-model="projectDraft.tags" placeholder="Vue, Node.js" />
        </div>
        <div>
          <label>排序（数字越小越靠前）</label>
          <input v-model.number="projectDraft.sort" type="number" />
        </div>
      </div>
      <div class="action-row">
        <button @click="handleSave" :disabled="saving">{{ saving ? (isNew ? '创建中...' : '更新中...') : (isNew ? '创建项目' : '更新项目') }}</button>
        <button class="secondary" @click="handleCancel" :disabled="saving">取消</button>
      </div>
    </div>
  </div>
</template>
