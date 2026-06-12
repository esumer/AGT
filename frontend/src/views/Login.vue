<script setup lang="ts">
import { ref } from 'vue'
import { KeyRound } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { LogIn } from 'lucide-vue-next'
import { setAuth } from '../auth'

const router = useRouter()
const form = ref({ email: '', password: '' })
const errorMsg = ref('')

const doLogin = async () => {
  errorMsg.value = ''
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    
    if (!res.ok) {
      errorMsg.value = data.error || 'Giriş başarısız.'
      return
    }
    
    setAuth(data.token, data.user)
    router.push('/')
  } catch (e) {
    errorMsg.value = 'Sunucu ile bağlantı kurulamadı.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">
    <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8 transition-colors">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <KeyRound class="w-8 h-8" />
        </div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">Giriş Yap</h1>
        <p class="text-slate-500 dark:text-slate-400 mt-2">Gider Takip sistemine hoş geldiniz.</p>
      </div>
      
      <div class="space-y-5">
        <div v-if="errorMsg" class="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {{ errorMsg }}
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">E-posta</label>
          <input v-model="form.email" type="email" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" placeholder="Kullanıcı e-postası">
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Şifre</label>
          <input v-model="form.password" type="password" @keyup.enter="doLogin" class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors" placeholder="••••••••">
        </div>
        
        <button @click="doLogin" class="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200 dark:shadow-none mt-4">
          Sisteme Gir
        </button>
      </div>
    </div>
  </div>
</template>
