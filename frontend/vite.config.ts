import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    build: {
      outDir: 'dist',
      // Production build için chunk boyutu uyarısını artır
      chunkSizeWarningLimit: 1000,
    },
    server: {
      // Dev mode için host (LAN erişimi test etmek istersen: host: '0.0.0.0')
      host: 'localhost',
      port: 5173,
    },
    // API URL'i environment variable'dan al
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:3000')
    }
  }
})
