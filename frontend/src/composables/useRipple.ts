/**
 * Ripple Effect - Material Design 风格波纹点击效果
 * 使用方法：在模板中添加 @click="createRipple($event)" 并确保元素有 position: relative 和 overflow: hidden
 */
export function createRipple(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  if (!target) return

  // 如果元素已经有波纹，跳过
  const existingRipple = target.querySelector('.ripple-circle')
  if (existingRipple) {
    existingRipple.remove()
  }

  const rect = target.getBoundingClientRect()
  const diameter = Math.max(rect.width, rect.height)
  const radius = diameter / 2

  // 计算点击位置相对于元素的位置
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top

  const ripple = document.createElement('span')
  ripple.className = 'ripple-circle'
  ripple.style.cssText = `
    position: absolute;
    width: ${diameter}px;
    height: ${diameter}px;
    left: ${offsetX - radius}px;
    top: ${offsetY - radius}px;
    background: rgba(125, 119, 221, 0.35);
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-anim 0.5s ease-out forwards;
    pointer-events: none;
    z-index: 1;
  `

  // 确保父元素有 position relative
  const computedStyle = window.getComputedStyle(target)
  if (computedStyle.position === 'static') {
    target.style.position = 'relative'
  }
  if (computedStyle.overflow === 'visible') {
    target.style.overflow = 'hidden'
  }

  target.appendChild(ripple)

  // 动画结束后移除波纹元素
  setTimeout(() => {
    ripple.remove()
  }, 500)
}

/**
 * 全局波纹效果指令
 * 在 main.ts 中注册后可以使用 v-ripple 指令
 */
export const rippleDirective = {
  mounted(el: HTMLElement) {
    el.addEventListener('click', createRipple as EventListener)
  },
  unmounted(el: HTMLElement) {
    el.removeEventListener('click', createRipple as EventListener)
  }
}
