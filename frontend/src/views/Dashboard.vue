<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Receipt, Users, FolderKanban, TrendingUp } from 'lucide-vue-next'
import { authState } from '../auth'
import { apiUrl } from '../api'

const expenses = ref([])
const users = ref([])
const categories = ref([])

const fetchInitialData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const [expRes, userRes, catRes] = await Promise.all([
    fetch(apiUrl('/api/expenses'), { headers }),
    fetch(apiUrl('/api/users'), { headers }),
    fetch(apiUrl('/api/categories'), { headers })
  ])
  
  if (expRes.ok) expenses.value = await expRes.json()
  if (userRes.ok) users.value = await userRes.json()
  if (catRes.ok) categories.value = await catRes.json()
}

const totalExpense = computed(() => {
  return expenses.value.reduce((total, exp: any) => total + exp.amount, 0)
})

const currentMonthExpense = computed(() => {
  const now = new Date()
  return expenses.value.filter((exp: any) => {
    const d = new Date(exp.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).reduce((total, exp: any) => total + exp.amount, 0)
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <!-- Toplam Gider -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <TrendingUp class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Bu Ayki Gider</p>
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ formatCurrency(currentMonthExpense) }}</h3>
        </div>
      </div>
      
      <!-- Toplam Gider (Genel) -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Receipt class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Tüm Zamanlar</p>
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ formatCurrency(totalExpense) }}</h3>
        </div>
      </div>

      <!-- Personel Sayısı -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Users class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Aktif Personel</p>
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ users.length }}</h3>
        </div>
      </div>

      <!-- Kategori Sayısı -->
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
        <div class="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
          <FolderKanban class="w-6 h-6" />
        </div>
        <div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Kategoriler</p>
          <h3 class="text-2xl font-bold text-slate-800 dark:text-slate-100">{{ categories.length }}</h3>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center">
        <img src="https://cdn-icons-png.flaticon.com/512/3256/3256111.png" alt="Welcome" class="w-32 h-32 opacity-20 dark:opacity-10 mb-6 drop-shadow-md mix-blend-luminosity">
        <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">ASM Gider Takip Sistemine Hoş Geldiniz</h2>
        <p class="text-slate-500 dark:text-slate-400 max-w-lg">Sol menüyü kullanarak gider ekleyebilir, geçmiş giderlerinizi listeleyebilir veya detaylı hesap tablolarını inceleyebilirsiniz.</p>
    </div>

  </div>
</template>
