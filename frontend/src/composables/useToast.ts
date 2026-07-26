import { ref, watch } from 'vue'

export const toastText = ref('')
export const toastVisible = ref(false)

let toastTimer: ReturnType<typeof setTimeout> | null = null

/** 显示一条 Toast 消息（2.8 秒后自动消失） */
export function showToast(msg: string) {
  if (!msg) return
  toastText.value = msg
  toastVisible.value = true
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2800)
}

// 兼容旧代码：adminMessage 变更时自动驱动 Toast
export const adminMessage = ref('')
watch(adminMessage, (msg) => {
  if (msg) showToast(msg)
})
