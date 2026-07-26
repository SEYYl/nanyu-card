<script setup lang="ts">
import {
  highlightDraft,
  saveHighlights, addHighlight, removeHighlight, moveHighlight,
} from '../../composables/useStore'
</script>

<template>
  <div>
    <div class="page-header">
      <h2>经历亮点</h2>
      <button @click="saveHighlights">保存经历亮点</button>
    </div>
    <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 20px;">按时间顺序展示你的关键阶段。</p>

    <div class="card panel" style="max-width: 720px;">
      <div class="highlight-editor">
        <div v-for="(item, index) in highlightDraft" :key="index" class="highlight-item">
          <div class="form-row two-col">
            <div>
              <label>时间段</label>
              <input v-model="item.period" placeholder="2024 — 现在" />
            </div>
            <div>
              <label>标题</label>
              <input v-model="item.title" placeholder="一句话概括" />
            </div>
          </div>
          <div class="form-row">
            <label>描述</label>
            <textarea v-model="item.description" rows="2" />
          </div>
          <div class="action-row">
            <button class="secondary" :disabled="index === 0" @click="moveHighlight(index, -1)">上移</button>
            <button class="secondary" :disabled="index === highlightDraft.length - 1" @click="moveHighlight(index, 1)">下移</button>
            <button class="secondary danger" @click="removeHighlight(index)">删除</button>
          </div>
        </div>
      </div>
      <div class="action-row" style="margin-top: 14px;">
        <button class="secondary" @click="addHighlight">新增一条</button>
      </div>
    </div>
  </div>
</template>
