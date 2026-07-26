<script setup lang="ts">
import {
  draft,
  saveSiteConfig, resetSiteDraft,
  uploadImage, clearAvatar, previewSite,
} from '../../composables/useStore'
</script>

<template>
  <div>
    <div class="page-header">
      <h2>站点设置</h2>
      <div class="action-row">
        <button @click="saveSiteConfig">保存站点信息</button>
        <button class="secondary" @click="resetSiteDraft">恢复当前内容</button>
      </div>
    </div>

    <div class="card panel" style="max-width: 720px;">
      <div class="form-row">
        <label>网站名称</label>
        <input v-model="draft.site_name" />
      </div>
      <div class="form-row">
        <label>简介</label>
        <textarea v-model="draft.description" rows="3" />
      </div>
      <div class="form-row">
        <label>关于我</label>
        <textarea v-model="draft.about" rows="3" />
      </div>
      <div class="form-row">
        <label>职业</label>
        <input v-model="draft.occupation" />
      </div>
      <div class="form-row">
        <label>头像</label>
        <div class="avatar-edit">
          <div class="avatar avatar-preview">
            <img v-if="draft.avatar" :src="draft.avatar" alt="头像预览" />
            <span v-else class="avatar-fallback">{{ (draft.site_name || 'N').slice(0, 1) }}</span>
          </div>
          <div class="avatar-actions">
            <input v-model="draft.avatar" placeholder="图片地址 /uploads/xxx.png" />
            <div class="action-row">
              <label class="upload-btn">
                选择图片上传
                <input type="file" accept="image/*" hidden @change="(event) => uploadImage('avatar', event)" />
              </label>
              <button v-if="draft.avatar" class="secondary danger" type="button" @click="clearAvatar">清除头像</button>
            </div>
          </div>
        </div>
      </div>
      <div class="form-row two-col">
        <div>
          <label>邮箱</label>
          <input v-model="draft.email" placeholder="name@example.com" />
        </div>
        <div>
          <label>GitHub</label>
          <input v-model="draft.github" placeholder="https://github.com/xxx" />
        </div>
      </div>
      <div class="form-row two-col">
        <div>
          <label>Telegram</label>
          <input v-model="draft.telegram" placeholder="@username" />
        </div>
        <div>
          <label>ICP 备案号</label>
          <input v-model="draft.icp" placeholder="京ICP备xxxxxxxx号" />
        </div>
      </div>
      <div class="form-row">
        <label>公安备案号</label>
        <input v-model="draft.police" placeholder="京公网安备 xxxxxxxxxxxxxx 号" />
      </div>

      <!-- Preview -->
      <div class="preview-card">
        <span class="preview-badge">实时预览</span>
        <h4 style="margin-top: 8px;">{{ previewSite.title }}</h4>
        <p style="font-size: 0.88rem;">{{ previewSite.description }}</p>
        <p style="font-size: 0.84rem; color: var(--text-muted);">{{ previewSite.about }}</p>
        <p style="font-size: 0.84rem; color: var(--text-muted);">职业：{{ previewSite.occupation }}</p>
      </div>
    </div>
  </div>
</template>
