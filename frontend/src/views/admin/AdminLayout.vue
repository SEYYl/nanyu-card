<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminSidebar from '../../components/admin/AdminSidebar.vue'
import { adminAuthenticated, checkSession, toastVisible, toastText } from '../../composables/useStore'

const router = useRouter()
const route = useRoute()
const sidebarOpen = ref(false)
const checking = ref(true)

const pageTitles: Record<string, string> = {
  '/admin': '数据看板',
  '/admin/site': '站点配置',
  '/admin/highlights': '经历亮点',
  '/admin/taxonomy': '标签管理',
  '/admin/projects': '项目管理',
  '/admin/settings': '修改密码',
}

onMounted(async () => {
  await checkSession()
  if (!adminAuthenticated.value) {
    router.replace('/admin/login')
  }
  checking.value = false
})

watch(adminAuthenticated, (val) => {
  if (!val && !checking.value) router.replace('/admin/login')
})

watch(() => route.path, () => {
  sidebarOpen.value = false
})
</script>

<template>
  <div v-if="checking" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <p style="color: var(--text-muted);">验证登录态...</p>
  </div>

  <div v-else-if="!adminAuthenticated" style="display: flex; align-items: center; justify-content: center; min-height: 100vh;">
    <p style="color: var(--text-muted); margin-bottom: 16px;">请先登录</p>
    <button @click="router.push('/admin/login')">前往登录</button>
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
        <router-view />
      </main>
    </div>
  </div>
</template>
