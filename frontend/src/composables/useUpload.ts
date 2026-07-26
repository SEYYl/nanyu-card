import { adminMessage } from './useToast'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export function validateImage(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return '只支持 JPG、PNG、GIF、WebP 格式的图片'
  if (file.size > MAX_SIZE) return '图片大小不能超过 5MB'
  return null
}

export async function uploadImage(file: File): Promise<{ url: string } | { error: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
  const data = await res.json()
  if (res.ok) {
    return { url: data.url as string }
  } else {
    return { error: data.error || '上传失败' }
  }
}

/** 处理文件选择事件：校验 → 上传 → 返回结果 */
export async function handleImageUpload(event: Event): Promise<string | null> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return null

  const err = validateImage(file)
  if (err) {
    adminMessage.value = err
    input.value = ''
    return null
  }

  adminMessage.value = '图片上传中...'
  const result = await uploadImage(file)
  input.value = ''

  if ('error' in result) {
    adminMessage.value = result.error
    return null
  }

  adminMessage.value = '图片已上传'
  return result.url
}
