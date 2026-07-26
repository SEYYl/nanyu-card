/**
 * 简单的表单校验工具函数
 */

/** 检查是否为空，返回错误消息或 null */
export function required(value: string, fieldName: string): string | null {
  if (!value || !value.trim()) return `${fieldName}不能为空`
  return null
}

/** 检查最小长度 */
export function minLength(value: string, min: number, fieldName: string): string | null {
  if (!value || !value.trim()) return null // 交由 required 处理
  if (value.trim().length < min) return `${fieldName}至少需要 ${min} 个字符`
  return null
}

/** 运行多个校验，返回第一个错误或 null */
export function validate(value: string, fieldName: string, ...rules: Array<(v: string, name: string) => string | null>): string | null {
  for (const rule of rules) {
    const err = rule(value, fieldName)
    if (err) return err
  }
  return null
}
