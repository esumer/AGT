<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { CalendarDays, Download } from 'lucide-vue-next'
import { authState } from '../auth'

const filterType = ref('YEAR') // 'YEAR' | 'RANGE'
const currentYear = ref(new Date().getFullYear())
const availableYears = ref<number[]>([])
const startDate = ref(new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0])
const endDate = ref(new Date().toISOString().split('T')[0])

const expenses = ref<any[]>([])
const categories = ref<any[]>([])
const users = ref<any[]>([])

const fetchInitialData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const [catRes, userRes] = await Promise.all([
    fetch('http://localhost:3000/api/categories', { headers }),
    fetch('http://localhost:3000/api/users', { headers })
  ])
  if (catRes.ok) categories.value = await catRes.json()
  if (userRes.ok) users.value = await userRes.json()

  // Generate some available years (e.g., from 2020 to currentYear + 1)
  const cy = new Date().getFullYear()
  for (let y = cy - 5; y <= cy + 1; y++) {
    availableYears.value.push(y)
  }
}

const fetchExpenses = async () => {
  let url = `http://localhost:3000/api/expenses`
  if (filterType.value === 'YEAR') {
    url += `?year=${currentYear.value}`
  } else {
    url += `?startDate=${startDate.value}&endDate=${endDate.value}`
  }

  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${authState.token}` }
  })
  if (res.ok) {
    expenses.value = await res.json()
  }
}

watch([currentYear, filterType, startDate, endDate], () => {
  fetchExpenses()
})

onMounted(async () => {
  await fetchInitialData()
  await fetchExpenses()
})

const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']

const displayedColumns = computed(() => {
  if (filterType.value === 'YEAR') {
    return months.map((m, i) => ({ label: m, month: i, year: currentYear.value }))
  } else {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    const cols = []
    let curr = new Date(start.getFullYear(), start.getMonth(), 1)
    const endBound = new Date(end.getFullYear(), end.getMonth(), 1)
    while (curr <= endBound && cols.length < 24) { // Max 24 ay sütunu
      cols.push({
        label: `${months[curr.getMonth()]} ${curr.getFullYear()}`,
        month: curr.getMonth(),
        year: curr.getFullYear()
      })
      curr.setMonth(curr.getMonth() + 1)
    }
    return cols
  }
})

// Gider Kalemleri Matrix
const categoryMatrix = computed(() => {
  const colsLength = displayedColumns.value.length || 1
  const matrix: Record<number, number[]> = {}
  categories.value.forEach(cat => {
    matrix[cat.id] = new Array(colsLength).fill(0)
  })
  // Diğer kategorisi için (Kategorisi silinmiş vs)
  matrix[0] = new Array(colsLength).fill(0)

  expenses.value.forEach(exp => {
    const d = new Date(exp.date)
    const expM = d.getMonth()
    const expY = d.getFullYear()
    
    const colIdx = displayedColumns.value.findIndex(c => c.month === expM && c.year === expY)
    if (colIdx !== -1) {
      const catId = exp.categoryId || 0
      if (!matrix[catId]) matrix[catId] = new Array(colsLength).fill(0)
      matrix[catId][colIdx] += exp.amount
    }
  })

  return matrix
})

const categoryTotals = computed(() => {
  const colsLength = displayedColumns.value.length || 1
  const totals = new Array(colsLength).fill(0)
  Object.values(categoryMatrix.value).forEach(row => {
    row.forEach((val, i) => {
      totals[i] += val
    })
  })
  return totals
})

// Kişiler Matrix (Kim, hangi ay kaç para ödedi?)
const userMatrix = computed(() => {
  const colsLength = displayedColumns.value.length || 1
  const matrix: Record<string, number[]> = {}
  users.value.forEach(u => {
    matrix[u.id] = new Array(colsLength).fill(0)
  })
  matrix['JOINT'] = new Array(colsLength).fill(0)

  expenses.value.forEach(exp => {
    const d = new Date(exp.date)
    const expM = d.getMonth()
    const expY = d.getFullYear()
    
    const colIdx = displayedColumns.value.findIndex(c => c.month === expM && c.year === expY)
    if (colIdx !== -1) {
      const userId = exp.userId === null ? 'JOINT' : exp.userId
      if (!matrix[userId]) matrix[userId] = new Array(colsLength).fill(0)
      matrix[userId][colIdx] += exp.amount
    }
  })

  return matrix
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val)
}
</script>

<template>
  <div class="max-w-[1400px] mx-auto space-y-8 animate-fade-in">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
          <CalendarDays class="w-6 h-6" />
        </div>
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Matrix Raporu</h2>
          <p class="text-sm text-slate-500 dark:text-slate-400">Giderlerin aylara göre dev dağılımı</p>
        </div>
      </div>
      
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button @click="filterType = 'YEAR'" :class="filterType === 'YEAR' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'" class="px-4 py-2 rounded-lg text-sm transition-all">Yıllık Görünüm</button>
          <button @click="filterType = 'RANGE'" :class="filterType === 'RANGE' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800'" class="px-4 py-2 rounded-lg text-sm transition-all">Tarih Aralığı</button>
        </div>
        
        <div v-if="filterType === 'YEAR'" class="flex items-center gap-2">
          <select v-model="currentYear" class="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none font-bold cursor-pointer">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        
        <div v-if="filterType === 'RANGE'" class="flex items-center gap-2">
          <input v-model="startDate" type="date" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm cursor-pointer">
          <span class="text-slate-400">-</span>
          <input v-model="endDate" type="date" class="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none text-sm cursor-pointer">
        </div>

        <button class="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-xl font-semibold transition-colors text-slate-700 dark:text-slate-200" title="Yakında: Excel/PDF İndir">
          <Download class="w-4 h-4" />
          İndir
        </button>
      </div>
    </div>

    <!-- Kategori Tablosu -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h3 class="font-bold text-slate-700 dark:text-slate-200">Gider Kalemleri Özeti</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="px-4 py-4 sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Gider</th>
              <th v-for="col in displayedColumns" :key="col.label" class="px-4 py-4 text-right min-w-[100px]">{{ col.label }}</th>
              <th class="px-4 py-4 text-right font-black text-slate-700 dark:text-slate-200 bg-emerald-50/30 dark:bg-emerald-900/10 min-w-[120px]">Toplam</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <tr v-for="cat in categories" :key="cat.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {{ cat.name }}
              </td>
              <td v-for="(val, idx) in categoryMatrix[cat.id]" :key="idx" class="px-4 py-3 text-right" :class="val > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-300 dark:text-slate-600'">
                {{ val > 0 ? formatCurrency(val) : '-' }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-900/10">
                {{ formatCurrency(categoryMatrix[cat.id].reduce((a,b)=>a+b, 0)) }}
              </td>
            </tr>
            <!-- Genel Toplam Satırı -->
            <tr class="bg-slate-50 dark:bg-slate-800 font-bold border-t-2 border-slate-200 dark:border-slate-700">
              <td class="px-4 py-4 sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                AYLIK TOPLAM
              </td>
              <td v-for="(val, idx) in categoryTotals" :key="idx" class="px-4 py-4 text-right text-slate-800 dark:text-slate-100">
                {{ formatCurrency(val) }}
              </td>
              <td class="px-4 py-4 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30">
                {{ formatCurrency(categoryTotals.reduce((a,b)=>a+b, 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Kişi Tablosu -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
        <h3 class="font-bold text-slate-700 dark:text-slate-200">Kişi Bazlı Ödemeler (Kim Ne Ödedi?)</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="px-4 py-4 sticky left-0 z-10 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 min-w-[180px]">Ödeyen Kişi</th>
              <th v-for="col in displayedColumns" :key="col.label" class="px-4 py-4 text-right min-w-[100px]">{{ col.label }}</th>
              <th class="px-4 py-4 text-right font-black text-slate-700 dark:text-slate-200 bg-emerald-50/30 dark:bg-emerald-900/10 min-w-[120px]">Toplam Çıkan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 font-bold text-emerald-700 dark:text-emerald-400">
                🏢 ASM Ortak Hesabı
              </td>
              <td v-for="(val, idx) in userMatrix['JOINT']" :key="idx" class="px-4 py-3 text-right" :class="val > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-300 dark:text-slate-600'">
                {{ val > 0 ? formatCurrency(val) : '-' }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-900/10">
                {{ formatCurrency((userMatrix['JOINT'] || []).reduce((a,b)=>a+b, 0)) }}
              </td>
            </tr>
            <tr v-for="u in users" :key="u.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-4 py-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                {{ u.name }}
              </td>
              <td v-for="(val, idx) in userMatrix[u.id]" :key="idx" class="px-4 py-3 text-right" :class="val > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-300 dark:text-slate-600'">
                {{ val > 0 ? formatCurrency(val) : '-' }}
              </td>
              <td class="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-900/10">
                {{ formatCurrency((userMatrix[u.id] || []).reduce((a,b)=>a+b, 0)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
