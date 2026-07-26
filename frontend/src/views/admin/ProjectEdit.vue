<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  projects, projectDraft, editingProjectId,
  saveProject, resetProjectDraft, editProject,
} from '../../composables/useProjects'
import { handleImageUpload } from '../../composables/useUpload'

const router = useRouter()
const route = useRoute()
const isNew = route.params.id === 'new'
const projectId = isNew ? null : Number(route.params.id)

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
  await saveProject()
  if (!editingProjectId.value) {
    router.push('/admin/projects')
  }
}

function handleCancel() {
  resetProjectDraft()
  router.push('/admin/projects')
}

async function onUploadCover(event: Event) {
  const url = await handleImageUpload(event)
  if (url) {
    projectDraft.value.cover = url
  }
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
      <div class="form-row">
        <label>封面</label>
        <div class="cover-edit">
          <div class="cover-preview">
            <img v-if="projectDraft.cover" :src="projectDraft.cover" alt="封面预览" />
            <span v-else class="muted" style="font-size: 0.84rem;">暂无封面</span>
          </div>
          <input v-model="projectDraft.cover" placeholder="图片地址 /uploads/xxx.png" />
          <label class="upload-btn">
            上传封面图片
            <input type="file" accept="image/*" hidden @change="onUploadCover" />
          </label>
        </div>
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
        <button @click="handleSave">{{ isNew ? '创建项目' : '更新项目' }}</button>
        <button class="secondary" @click="handleCancel">取消</button>
      </div>
    </div>
  </div>
</template>
