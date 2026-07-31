<script setup lang="ts">
import { ref } from 'vue'
import { focusAreasText, skillsText, saveTaxonomy } from '../../composables/useSite'

const saving = ref(false)

async function handleSave() {
  if (saving.value) return
  saving.value = true
  try {
    await saveTaxonomy()
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>标签管理</h2>
      <button @click="handleSave" :disabled="saving">{{ saving ? '保存中...' : '保存' }}</button>
    </div>
    <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 20px;">用「、」或英文逗号分隔多个标签。</p>

    <div class="card panel" style="max-width: 560px;">
      <div class="form-row">
        <label>我正在关注</label>
        <input v-model="focusAreasText" placeholder="AI、开源、互联网产品" />
      </div>
      <div class="form-row">
        <label>技能栈</label>
        <input v-model="skillsText" placeholder="Vue、TypeScript、Node.js" />
      </div>
    </div>
  </div>
</template>
