import { ref } from 'vue'

/**
 * 防抖 Hook - 防止按钮重复点击
 * @param delay 延迟时间（毫秒），默认 800ms
 * @returns { isLoading, run }
 *
 * 使用示例：
 * const { isLoading, run } = useDebounce()
 * <button :disabled="isLoading" @click="run(async () => { await saveData() })">
 */
export function useDebounce(delay: number = 800) {
  const isLoading = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  async function run<T>(fn: () => Promise<T>): Promise<T | undefined> {
    // 如果正在执行，跳过
    if (isLoading.value) {
      return undefined
    }

    isLoading.value = true

    try {
      const result = await fn()
      return result
    } finally {
      // 延迟后重置状态
      timer = setTimeout(() => {
        isLoading.value = false
      }, delay)
    }
  }

  // 立即取消（用于组件卸载时清理）
  function cancel() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    isLoading.value = false
  }

  return {
    isLoading,
    run,
    cancel
  }
}

/**
 * 简单防抖函数 - 用于非 async 函数
 * @param fn 要执行的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timer) {
      clearTimeout(timer)
    }
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数 - 限制函数执行频率
 * @param fn 要执行的函数
 * @param delay 间隔时间（毫秒）
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay: number = 300
): (...args: Parameters<T>) => void {
  let lastTime = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}
