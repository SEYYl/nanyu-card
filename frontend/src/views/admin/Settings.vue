<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { confirmDialog, promptDialog } from '../../composables/useDialog'
import { changePassword, adminLogout } from '../../composables/useAuth'
import { adminMessage } from '../../composables/useToast'

const router = useRouter()
const loading = ref(false)

async function handleChangePassword() {
  if (loading.value) return
  loading.value = true
  try {
    const newPassword = await promptDialog('修改密码', '请输入新密码（至少 8 位）')
    if (!newPassword) return
    const result = await changePassword(newPassword)
    adminMessage.value = result.message
  } finally {
    loading.value = false
  }
}

async function handleLogout() {
  const ok = await confirmDialog('退出登录', '确认退出当前管理后台会话？')
  if (!ok) return
  await adminLogout()
  adminMessage.value = '已退出登录'
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
        <button @click="handleChangePassword" :disabled="loading">{{ loading ? '处理中...' : '修改密码' }}</button>
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
