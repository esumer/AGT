<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Calculator, Wallet, ArrowRightLeft, User, CalendarDays } from 'lucide-vue-next'
import { authState } from '../auth'

const currentMonth = ref(new Date().getMonth() + 1)
const currentYear = ref(new Date().getFullYear())

const reportData = ref<{ totalExpense: number, jointPaid: number, userBalances: any[] } | null>(null)
const errorMsg = ref('')

const months = [
  { val: 1, name: 'Ocak' }, { val: 2, name: 'Şubat' }, { val: 3, name: 'Mart' },
  { val: 4, name: 'Nisan' }, { val: 5, name: 'Mayıs' }, { val: 6, name: 'Haziran' },
  { val: 7, name: 'Temmuz' }, { val: 8, name: 'Ağustos' }, { val: 9, name: 'Eylül' },
  { val: 10, name: 'Ekim' }, { val: 11, name: 'Kasım' }, { val: 12, name: 'Aralık' }
]

const fetchReport = async () => {
  errorMsg.value = ''
  try {
    const res = await fetch(`http://localhost:3000/api/reports?month=${currentMonth.value}&year=${currentYear.value}`, {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    })
    
    if (!res.ok) throw new Error('Rapor alınamadı')
    reportData.value = await res.json()
  } catch (e) {
    errorMsg.value = 'Rapor hesaplanırken bir hata oluştu.'
    reportData.value = null
  }
}

watch([currentMonth, currentYear], () => {
  fetchReport()
})

onMounted(() => {
  fetchReport()
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    
    <!-- Filtre Kartı -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-wrap gap-6 items-end transition-colors">
      <div>
        <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5 flex items-center gap-2">
          <CalendarDays class="w-4 h-4" /> Ay
        </label>
        <select v-model="currentMonth" class="w-48 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 transition-colors">
          <option v-for="m in months" :key="m.val" :value="m.val">{{ m.name }}</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Yıl</label>
        <input v-model="currentYear" type="number" class="w-32 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 text-center transition-colors">
      </div>
      <button @click="fetchReport" class="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold transition-colors shadow-sm whitespace-nowrap h-[46px]">
        Hesapla
      </button>
    </div>

    <!-- Hata Mesajı -->
    <div v-if="errorMsg" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 font-medium">
      {{ errorMsg }}
    </div>

    <!-- İstatistikler -->
    <div v-if="reportData" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="bg-gradient-to-br from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-6 shadow-lg text-white border border-slate-700 dark:border-slate-800">
        <p class="text-slate-300 dark:text-slate-400 font-medium text-sm flex items-center gap-2 mb-2">
          <Calculator class="w-4 h-4" /> Toplam ASM Gideri
        </p>
        <h3 class="text-3xl font-bold">{{ formatCurrency(reportData.totalExpense) }}</h3>
      </div>
      
      <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <p class="text-slate-500 dark:text-slate-400 font-medium text-sm flex items-center gap-2 mb-2">
          <Wallet class="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Ortak Hesaptan Ödenen
        </p>
        <h3 class="text-3xl font-bold text-slate-800 dark:text-slate-100">{{ formatCurrency(reportData.jointPaid) }}</h3>
      </div>
      
      <div class="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-6 shadow-sm border border-emerald-100 dark:border-emerald-900/30 transition-colors">
        <p class="text-emerald-700 dark:text-emerald-400 font-medium text-sm flex items-center gap-2 mb-2">
          <ArrowRightLeft class="w-4 h-4" /> Cepten Ödenen (Doktorlar)
        </p>
        <h3 class="text-3xl font-bold text-emerald-800 dark:text-emerald-300">{{ formatCurrency(reportData.totalExpense - reportData.jointPaid) }}</h3>
      </div>
    </div>

    <!-- Doktorlar Hesap Tablosu -->
    <div v-if="reportData" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Hesap Kesim Özeti</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Bu ayki harcamalara göre kimin kime ne kadar borcu kaldığı listelenmiştir.</p>
        </div>
      </div>
      
      <div class="p-0 overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="px-6 py-4">Doktor Adı</th>
              <th class="px-6 py-4 text-right">Kendi Ödediği</th>
              <th class="px-6 py-4 text-right">Payına Düşen Gider</th>
              <th class="px-6 py-4 text-right">Sonuç (Bakiye)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="u in reportData.userBalances" :key="u.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                <div class="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                  <User class="w-4 h-4" />
                </div>
                <div>
                  <p>{{ u.name }}</p>
                  <p class="text-xs font-normal text-slate-500 dark:text-slate-400">{{ u.title }}</p>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 text-right">{{ formatCurrency(u.totalPaid) }}</td>
              <td class="px-6 py-4 text-sm font-medium text-slate-600 dark:text-slate-300 text-right">{{ formatCurrency(u.totalShare) }}</td>
              <td class="px-6 py-4 text-right">
                <div v-if="Math.abs(u.balance) < 0.01" class="text-slate-500 dark:text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-lg">Ödeşildi (0.00)</div>
                <div v-else-if="u.balance < 0" class="text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-900/20 inline-block px-3 py-1 rounded-lg border border-red-100 dark:border-red-900/30">
                  Borçlu: {{ formatCurrency(Math.abs(u.balance)) }}
                </div>
                <div v-else class="text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 inline-block px-3 py-1 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                  Alacaklı: {{ formatCurrency(u.balance) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400">
        <p><strong>Nasıl Okunur?</strong></p>
        <p class="mt-1">Borçlu (Kırmızı) olan doktorlar, aradaki farkı sisteme (Ortak Hesaba veya doğrudan Alacaklı doktorlara) ödemelidir. Alacaklı (Yeşil) olan doktorlar ise cebinden fazla ödeme yaptığı için havuzdan bu tutarı geri alacaktır.</p>
      </div>
    </div>

  </div>
</template>
