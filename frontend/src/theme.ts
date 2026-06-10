import { ref } from 'vue'

const storedTheme = localStorage.getItem('theme') || 'light'
export const isDark = ref(storedTheme === 'dark')

export const toggleTheme = () => {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('theme', theme)
  
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Initial set
if (isDark.value) {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}
