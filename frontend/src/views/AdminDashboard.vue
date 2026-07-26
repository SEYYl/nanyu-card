<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  adminAuthenticated, adminMessage, toastText, toastVisible,
  checkSession, loadSiteData, adminLogout,
  draft, saveSiteConfig, resetSiteDraft, changePassword,
  highlightDraft, saveHighlights, addHighlight, removeHighlight, moveHighlight,
  focusAreasText, skillsText, saveTaxonomy,
  projects, projectDraft, editingProjectId, saveProject, resetProjectDraft, editProject, deleteProject,
  uploadImage, clearAvatar, previewSite,
} from '../composables/useStore'

const router = useRouter()
const activeTab = ref<'site' | 'highlights' | 'taxonomy' | 'projects'>('site')
const checking = ref(true)

onMounted(async () => {
  await checkSession()
  if (adminAuthenticated.value) {
    await loadSiteData()
  }
  checking.value = false
})

watch(adminAuthenticated, (val) => {
  if (!val && !checking.value) router.replace('/admin/login')
})

function handleLogout() {
  adminLogout()
  router.replace('/admin/login')
}
</script>

<template>
  <div v-if="checking" class="container" style="padding-top: 120px; text-align: center;">
    <p style="color: var(--text-muted);">检查登录态...</p>
  </div>

  <div v-else-if="!adminAuthenticated" class="container" style="padding-top: 120px; text-align: center;">
    <p style="color: var(--text-muted); margin-bottom: 16px;">请先登录</p>
    <button @click="router.push('/admin/login')">前往登录</button>
  </div>

  <div v-else class="container">
    <div style="padding-top: 32px;">
      <h1 style="margin-bottom: 4px;">后台管理</h1>
      <p style="color: var(--text-muted); margin-bottom: 24px;">{{ adminMessage || '可在这里修改站点信息和项目内容。' }}</p>

      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toastVisible" class="toast">{{ toastText }}</div>
      </Transition>

      <nav class="admin-tabs">
        <button :class="{ active: activeTab === 'site' }" @click="activeTab = 'site'">站点信息</button>
        <button :class="{ active: activeTab === 'highlights' }" @click="activeTab = 'highlights'">经历亮点</button>
        <button :class="{ active: activeTab === 'taxonomy' }" @click="activeTab = 'taxonomy'">关注方向 / 技能</button>
        <button :class="{ active: activeTab === 'projects' }" @click="activeTab = 'projects'">项目管理</button>
      </nav>

      <!-- Site Config -->
      <div v-show="activeTab === 'site'" class="card panel" style="margin-top: 20px;">
        <h3>站点设置</h3>
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
                <button v-if="draft.avatar" class="secondary" type="button" @click="clearAvatar">清除头像</button>
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
            <input v-model="draft.telegram" placeholder="@username 或 https://t.me/xxx" />
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
        <div class="action-row">
          <button @click="saveSiteConfig">保存站点信息</button>
          <button class="secondary" @click="resetSiteDraft">恢复当前内容</button>
          <button class="secondary" @click="changePassword">修改密码</button>
          <button class="secondary" @click="handleLogout">退出登录</button>
          <button class="secondary" @click="router.push('/')">查看前台</button>
        </div>
        <div class="preview-card">
          <span class="preview-badge">实时预览</span>
          <h4 style="margin-top: 8px;">{{ previewSite.title }}</h4>
          <p style="font-size: 0.88rem;">{{ previewSite.description }}</p>
          <p style="font-size: 0.84rem; color: var(--text-muted);">{{ previewSite.about }}</p>
          <p style="font-size: 0.84rem; color: var(--text-muted);">职业：{{ previewSite.occupation }}</p>
        </div>
      </div>

      <!-- Highlights -->
      <div v-show="activeTab === 'highlights'" class="card panel" style="margin-top: 20px;">
        <h3>经历亮点</h3>
        <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 16px;">按时间顺序展示你的关键阶段。</p>
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
          <button @click="saveHighlights">保存经历亮点</button>
        </div>
      </div>

      <!-- Taxonomy -->
      <div v-show="activeTab === 'taxonomy'" class="card panel" style="margin-top: 20px;">
        <h3>关注方向 / 技能</h3>
        <p style="font-size: 0.86rem; color: var(--text-muted); margin-bottom: 16px;">用「、」或英文逗号分隔多个标签。</p>
        <div class="form-row">
          <label>我正在关注</label>
          <input v-model="focusAreasText" placeholder="AI、开源、互联网产品" />
        </div>
        <div class="form-row">
          <label>技能栈</label>
          <input v-model="skillsText" placeholder="Vue、TypeScript、Node.js" />
        </div>
        <div class="action-row">
          <button @click="saveTaxonomy">保存关注方向与技能</button>
        </div>
      </div>

      <!-- Projects -->
      <div v-show="activeTab === 'projects'" class="card panel" style="margin-top: 20px;">
        <h3>项目管理</h3>
        <div class="form-row">
          <label>项目标题</label>
          <input v-model="projectDraft.title" />
        </div>
        <div class="form-row">
          <label>简介</label>
          <textarea v-model="projectDraft.description" rows="3" />
        </div>
        <div class="form-row">
          <label>详细介绍</label>
          <textarea v-model="projectDraft.content" rows="4" />
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
              <input type="file" accept="image/*" hidden @change="(event) => uploadImage('cover', event)" />
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
          <button @click="saveProject">{{ editingProjectId ? '更新项目' : '新增项目' }}</button>
          <button class="secondary" @click="resetProjectDraft">{{ editingProjectId ? '取消编辑' : '清空表单' }}</button>
        </div>

        <div class="project-list">
          <div v-for="project in projects" :key="project.id" class="project-row card">
            <div class="project-row-meta">
              <strong>{{ project.title }}</strong>
              <span class="small">排序 {{ project.sort }} · {{ project.tags.length }} 个标签</span>
            </div>
            <div class="action-row">
              <button class="secondary" @click="editProject(project)">编辑</button>
              <button class="secondary danger" @click="deleteProject(project.id)">删除</button>
            </div>
          </div>
          <p v-if="!projects.length" class="empty-state inline">还没有项目，先用上面的表单添加一个吧。</p>
        </div>
      </div>

    </div>
  </div>
</template>
