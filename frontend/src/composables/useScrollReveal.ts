/**
 * 滚动淡入指令 — v-scroll-reveal
 * 元素进入视口时自动添加 .visible class
 *
 * 用法：
 * <article v-scroll-reveal class="project-card"> ... </article>
 *
 * CSS 配合：
 * .project-card.reveal-on-scroll { opacity: 0; transform: translateY(16px); transition: all 0.45s ease; }
 * .project-card.reveal-on-scroll.visible { opacity: 1; transform: translateY(0); }
 */
export const vScrollReveal = {
  mounted(el: HTMLElement) {
    el.classList.add('reveal-on-scroll')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 延迟触发，实现逐个淡入
            const delay = Number(el.dataset.revealDelay) || 0
            setTimeout(() => {
              el.classList.add('visible')
            }, delay)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -20px 0px' }
    )

    observer.observe(el)
    // 保存 observer 引用供 unmounted 使用
    ;(el as any).__revealObserver = observer
  },

  unmounted(el: HTMLElement) {
    const observer = (el as any).__revealObserver
    if (observer) observer.disconnect()
  },
}
