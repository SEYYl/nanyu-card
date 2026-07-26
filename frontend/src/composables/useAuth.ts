import { reactive, ref } from 'vue'

export const adminAuthenticated = ref(false)
export const loginForm = reactive({ username: '', password: '' })
export const loginError = ref('')

export async function checkSession() {
  try {
    const res = await fetch('/api/admin/session')
    const data = await res.json()
    adminAuthenticated.value = Boolean(data.authenticated)
  } catch {
    adminAuthenticated.value = false
  }
}

export async function adminLogin() {
  loginError.value = ''
  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: loginForm.username, password: loginForm.password }),
    })
    const data = await res.json()
    if (res.ok) {
      adminAuthenticated.value = true
      return true
    } else {
      loginError.value = data.error || '登录失败'
      return false
    }
  } catch (err: any) {
    loginError.value = err.message || '网络错误，请检查连接后重试'
    return false
  }
}

export async function adminLogout() {
  await fetch('/api/admin/logout', { method: 'POST' })
  adminAuthenticated.value = false
}

export async function changePassword(newPassword: string) {
  const res = await fetch('/api/admin/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword }),
  })
  const data = await res.json()
  if (res.ok) {
    return { ok: true as const, message: '密码已修改' }
  } else {
    return { ok: false as const, message: data.error || '修改失败' }
  }
}
