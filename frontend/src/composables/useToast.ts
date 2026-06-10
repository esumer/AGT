import { ref } from 'vue'

export interface ToastMessage {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

const toasts = ref<ToastMessage[]>([])
let nextId = 1

export function useToast() {
  const show = (type: 'success' | 'error' | 'info', message: string, duration = 3000) => {
    const id = nextId++
    toasts.value.push({ id, type, message })
    setTimeout(() => {
      remove(id)
    }, duration)
  }

  const success = (message: string, duration?: number) => show('success', message, duration)
  const error = (message: string, duration?: number) => show('error', message, duration)
  const info = (message: string, duration?: number) => show('info', message, duration)

  const remove = (id: number) => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  return { toasts, success, error, info, remove }
}
