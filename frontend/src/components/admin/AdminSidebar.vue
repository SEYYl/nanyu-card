<script setup lang="ts">
import { useRouter } from 'vue-router'
import { site } from '../../composables/useSite'
import { adminLogout } from '../../composables/useAuth'
import { currentTheme, toggleTheme } from '../../composables/useTheme'
import { adminMessage } from '../../composables/useToast'

defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [val: boolean] }>()

const router = useRouter()

function navTo(path: string) {
  router.push(path)
  emit('update:open', false)
}

async function handleLogout() {
  await adminLogout()
  adminMessage.value = '已退出登录'
  router.replace('/admin/login')
}
</script>

<template>
  <!-- Overlay for mobile -->
  <div class="sidebar-overlay" :class="{ open }" @click="emit('update:open', false)"></div>

  <aside class="admin-sidebar" :class="{ open }">
    <div class="admin-sidebar-brand">
      <strong @click="navTo('/admin')">{{ site.site_name || '后台管理' }}</strong>
    </div>

    <nav class="admin-sidebar-nav">
      <router-link to="/admin" exact-active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">📊</span> 数据看板
      </router-link>
      <router-link to="/admin/site" active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">⚙️</span> 站点配置
      </router-link>
      <router-link to="/admin/highlights" active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">🏆</span> 经历亮点
      </router-link>
      <router-link to="/admin/taxonomy" active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">🏷️</span> 标签管理
      </router-link>
      <router-link to="/admin/projects" active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">📁</span> 项目管理
      </router-link>
      <router-link to="/admin/settings" active-class="active" @click="emit('update:open', false)">
        <span class="nav-icon">🔒</span> 修改密码
      </router-link>
    </nav>

    <div class="admin-sidebar-footer">
      <button class="theme-toggle" @click="toggleTheme">
        <span class="nav-icon">{{ currentTheme === 'dark' ? '☀️' : '🌙' }}</span>
        {{ currentTheme === 'dark' ? '浅色模式' : '深色模式' }}
      </button>
      <button class="nav-item" @click="handleLogout">
        <span class="nav-icon">🚪</span> 退出登录
      </button>
      <button class="nav-item" @click="router.push('/'); emit('update:open', false)">
        <span class="nav-icon">🏠</span> 查看前台
      </button>
    </div>
  </aside>
</template>
