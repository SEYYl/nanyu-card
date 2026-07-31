<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'
import { adminAuthenticated } from '../../composables/useAuth'
import { toastVisible, toastText } from '../../composables/useToast'
import ConfirmModal from '../../components/common/ConfirmModal.vue'
import { createRipple } from '../../composables/useRipple'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)

// Esc 关闭侧边栏
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && sidebarOpen.value) {
    sidebarOpen.value = false
  }
}

// 全局波纹效果 + 键盘事件
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.matches('button, .button, .badge, .nav-item, .back-link')) {
      createRipple(e as MouseEvent)
    }
  }, true)
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

const pageTitles: Record<string, string> = {
  '/admin': '数据看板',
  '/admin/site': '站点配置',
  '/admin/highlights': '经历亮点',
  '/admin/taxonomy': '标签管理',
  '/admin/projects': '项目管理',
  '/admin/settings': '修改密码',
}

// 路由变更时关闭移动端侧边栏
watch(() => route.path, () => {
  sidebarOpen.value = false
})

// 路由守卫已校验登录态，这里做安全兜底
watch(adminAuthenticated, (val) => {
  if (!val) router.replace('/admin/login')
})
</script>

<template>
  <div v-if="!adminAuthenticated" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <p style="color: var(--text-muted);">验证登录态中...</p>
  </div>

  <div v-else class="admin-layout">
    <AdminSidebar v-model:open="sidebarOpen" />

    <div class="admin-main">
      <!-- Toast -->
      <Transition name="toast">
        <div v-if="toastVisible" class="toast">{{ toastText }}</div>
      </Transition>

      <header class="admin-header">
        <div style="display: flex; align-items: center; gap: 12px;">
          <button class="menu-toggle" @click="sidebarOpen = !sidebarOpen" aria-label="菜单">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <h2>{{ pageTitles[route.path] || '后台管理' }}</h2>
        </div>
      </header>

      <main class="admin-content">
        <router-view v-slot="{ Component }">
          <Transition name="admin-page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </router-view>
      </main>
    </div>
  </div>

  <!-- 全局弹窗 -->
  <ConfirmModal />
</template>
