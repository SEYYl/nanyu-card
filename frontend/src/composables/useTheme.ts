import { ref } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'nanyu-card-theme'

const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
export const currentTheme = ref<Theme>(stored || 'light')
export const themeLabel = ref(stored ? (stored === 'dark' ? '深色' : '浅色') : '跟随系统')

function applyTheme(theme: Theme | null) {
  if (theme) {
    document.documentElement.setAttribute('data-theme', theme)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

// Watch system preference when no manual override
const systemDark = window.matchMedia('(prefers-color-scheme: dark)')
systemDark.addEventListener('change', () => {
  if (!localStorage.getItem(STORAGE_KEY)) {
    // Only react when user hasn't manually chosen
  }
})

// Apply on init
if (stored) {
  applyTheme(stored)
}
// Otherwise rely on the CSS media query in style.css

export function toggleTheme() {
  const next = currentTheme.value === 'dark' ? 'light' : 'dark'
  currentTheme.value = next
  themeLabel.value = next === 'dark' ? '深色' : '浅色'
  localStorage.setItem(STORAGE_KEY, next)
  applyTheme(next)
}

export function resetTheme() {
  currentTheme.value = 'light'
  themeLabel.value = '跟随系统'
  localStorage.removeItem(STORAGE_KEY)
  applyTheme(null)
}
