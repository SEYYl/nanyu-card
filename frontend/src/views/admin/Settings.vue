<script setup lang="ts">
import { useRouter } from 'vue-router'
import { changePassword, adminLogout } from '../../composables/useStore'

const router = useRouter()

async function handleLogout() {
  await adminLogout()
  router.replace('/admin/login')
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>安全设置</h2>
    </div>

    <div class="card panel settings-card">
      <div style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 8px;">修改密码</h3>
        <p style="font-size: 0.86rem; color: var(--text-muted);">点击下方按钮，输入新密码（至少 4 位字符）。</p>
      </div>
      <div class="action-row">
        <button @click="changePassword">修改密码</button>
      </div>
    </div>

    <div class="card panel settings-card" style="margin-top: 20px;">
      <div style="margin-bottom: 24px;">
        <h3 style="margin-bottom: 8px;">退出登录</h3>
        <p style="font-size: 0.86rem; color: var(--text-muted);">退出当前管理后台会话。</p>
      </div>
      <div class="action-row">
        <button class="danger" @click="handleLogout">退出登录</button>
      </div>
    </div>
  </div>
</template>
