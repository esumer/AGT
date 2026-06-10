<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { PlusCircle, Receipt, Trash2, CalendarDays } from 'lucide-vue-next'
import { authState } from '../auth'
import { useToast } from '../composables/useToast'

const { success, error: toastError } = useToast()
const expenses = ref([])
const users = ref([])
const categories = ref([])

const newExpense = ref({
  amount: '',
  description: '',
  categoryId: '',
  date: new Date().toISOString().split('T')[0],
  userId: authState.user?.id || '',
  exemptUserIds: [] as number[],
  isPeriodic: false,
  periodStart: '',
  periodEnd: '',
  isRecurring: false,
  recurringInterval: 'MONTHLY',
  recurringEndDate: ''
})

const receiptFile = ref<File | null>(null)

const isAdminOrSec = computed(() => authState.user?.role === 'ADMIN' || authState.user?.role === 'SECRETARY')

const isAdvancedModalOpen = ref(false)

const fetchInitialData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const [expRes, userRes, catRes] = await Promise.all([
    fetch('http://localhost:3000/api/expenses', { headers }),
    fetch('http://localhost:3000/api/users', { headers }),
    fetch('http://localhost:3000/api/categories', { headers })
  ])
  
  if (expRes.ok) expenses.value = await expRes.json()
  if (userRes.ok) users.value = await userRes.json()
  if (catRes.ok) categories.value = await catRes.json()
}



const deleteExpense = async (expense: any) => {
  let url = `http://localhost:3000/api/expenses/${expense.id}`;
  
  if (expense.recurringGroupId) {
    const deleteAll = confirm('Bu Gider TEKRARLAYAN bir Gider grubunun parçası. Sadece bunu mu, yoksa bu tarihten sonraki tüm tekrarlarını mı silmek istersin?\n\nTAMAM: İleriye dönük tüm tekrarları sil.\nİPTAL: Sadece bu Giderı sil.');
    if (deleteAll) {
      url += '?deleteAllRecurring=true';
    }
  } else {
    if (!confirm('Bu Giderı silmek istediğinize emin misiniz?')) return;
  }

  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authState.token}` }
  });

  if (res.ok) {
    success('Gider silindi');
    // Listeyi yenile
    const expRes = await fetch('http://localhost:3000/api/expenses', {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    })
    expenses.value = await expRes.json()
  } else {
    toastError('Gider silinemedi');
  }
}

const totalExpense = computed(() => {
  return expenses.value.reduce((total, exp: any) => total + exp.amount, 0)
})

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

const formatDate = (dateStr: string) => {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(dateStr))
}

onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    




    <!-- Gider Listesi -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Son Giderlar</h3>
      </div>
      
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors">
              <th class="px-6 py-4">Tarih</th>
              <th class="px-6 py-4">Kategori</th>
              <th class="px-6 py-4">Açıklama</th>
              <th class="px-6 py-4">Kişi</th>
              <th class="px-6 py-4">Belge</th>
              <th class="px-6 py-4 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="expense in expenses" :key="expense.id" class="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                <div class="flex items-center gap-2">
                  <CalendarDays class="w-4 h-4 text-slate-400" />
                  {{ new Date(expense.date).toLocaleDateString('tr-TR') }}
                  <span v-if="expense.recurringGroupId" title="Tekrarlayan Gider" class="text-emerald-500">🔄</span>
                </div>
              </td>
              <td class="px-6 py-4 text-sm">
                <span class="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium border border-slate-200/60 dark:border-slate-700">{{ expense.category?.name }}</span>
              </td>
              <td class="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{{ expense.description || '-' }}</td>
              <td class="px-6 py-4 text-sm font-medium">
                <span v-if="!expense.user" class="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200 dark:border-emerald-800/50">ASM Ortak Hesabı</span>
                <span v-else class="text-slate-800 dark:text-slate-200">{{ expense.user.name }}</span>
              </td>
              <td class="px-6 py-4">
                <a v-if="expense.receiptUrl" :href="'http://localhost:3000' + expense.receiptUrl" target="_blank" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors" title="Faturayı Görüntüle">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </a>
                <span v-else class="text-slate-400 dark:text-slate-600 text-xs">-</span>
              </td>
              <td class="px-6 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400 text-right">{{ formatCurrency(exp.amount) }}</td>
            </tr>
            <tr v-if="expenses.length === 0">
              <td colspan="6" class="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                <Receipt class="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p>Henüz Gider kaydı bulunmuyor.</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>


  </div>
</template>
