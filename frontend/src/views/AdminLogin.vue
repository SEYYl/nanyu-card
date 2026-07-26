<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { loginForm, loginError, adminLogin } from '../composables/useStore'

const router = useRouter()
const loading = ref(false)

watch([() => loginForm.username, () => loginForm.password], () => {
  loginError.value = ''
})

async function handleLogin() {
  loading.value = true
  const ok = await adminLogin()
  loading.value = false
  if (ok) router.replace('/admin')
}
</script>

<template>
  <div class="login-page">
    <div class="login-card card">
      <div class="login-card-body">
        <h1>后台登录</h1>
        <p class="login-sub" style="margin-bottom: 28px; color: var(--text-muted); font-size: 0.88rem;">请使用管理员账号登录</p>

        <div v-if="loginError" class="error-text">{{ loginError }}</div>

        <div class="form-row">
          <label>用户名</label>
          <input v-model="loginForm.username" autocomplete="username" @keyup.enter="handleLogin" />
        </div>
        <div class="form-row">
          <label>密码</label>
          <input v-model="loginForm.password" type="password" autocomplete="current-password" @keyup.enter="handleLogin" />
        </div>
        <div class="action-row" style="justify-content: space-between;">
          <button @click="handleLogin" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
          <button class="secondary" @click="router.push('/')">返回首页</button>
        </div>
      </div>
    </div>
  </div>
</template>
