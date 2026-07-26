import { reactive } from 'vue'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DialogResolve = (value: any) => void

interface DialogState {
  visible: boolean
  type: 'confirm' | 'prompt'
  title: string
  message: string
  inputValue: string
  inputPlaceholder: string
  resolve: DialogResolve | null
}

export const dialogState = reactive<DialogState>({
  visible: false,
  type: 'confirm',
  title: '',
  message: '',
  inputValue: '',
  inputPlaceholder: '',
  resolve: null,
})

/** 确认对话框，返回 true/false */
export function confirmDialog(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    dialogState.type = 'confirm'
    dialogState.title = title
    dialogState.message = message
    dialogState.resolve = (val) => resolve(val as boolean)
    dialogState.visible = true
  })
}

/** 输入对话框，返回输入值或 null（取消） */
export function promptDialog(title: string, placeholder = ''): Promise<string | null> {
  return new Promise((resolve) => {
    dialogState.type = 'prompt'
    dialogState.title = title
    dialogState.message = title
    dialogState.inputValue = ''
    dialogState.inputPlaceholder = placeholder
    dialogState.resolve = resolve
    dialogState.visible = true
  })
}

export function confirmResult(result: boolean | string | null = false) {
  if (dialogState.resolve) {
    dialogState.resolve(result)
  }
  dialogState.visible = false
  dialogState.resolve = null
}
