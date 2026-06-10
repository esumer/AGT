import { reactive } from 'vue'

export const authState = reactive({
  user: null as any | null,
  token: localStorage.getItem('asm_token') || null
})

export const setAuth = (token: string, user: any) => {
  authState.token = token
  authState.user = user
  localStorage.setItem('asm_token', token)
  localStorage.setItem('asm_user', JSON.stringify(user))
}

export const clearAuth = () => {
  authState.token = null
  authState.user = null
  localStorage.removeItem('asm_token')
  localStorage.removeItem('asm_user')
}

// Restore user from localStorage on load
const storedUser = localStorage.getItem('asm_user')
if (storedUser) {
  try {
    authState.user = JSON.parse(storedUser)
  } catch (e) {
    clearAuth()
  }
}
