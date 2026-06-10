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

const addExpense = async () => {
  if (!newExpense.value.amount || !newExpense.value.categoryId || !newExpense.value.userId) {
    return toastError('Lütfen tutar, kategori ve kişi alanlarını doldurun.')
  }
  if (newExpense.value.isPeriodic && (!newExpense.value.periodStart || !newExpense.value.periodEnd)) {
    return toastError('Dönemsel Giderlar için başlangıç ve bitiş tarihi girilmelidir.')
  }
  
  let receiptUrl = null;

  // Önce fotoğrafı yükle
  if (receiptFile.value) {
    const formData = new FormData()
    formData.append('receipt', receiptFile.value)
    try {
      const uploadRes = await fetch('http://localhost:3000/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authState.token}` },
        body: formData
      })
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        receiptUrl = uploadData.url
      } else {
        toastError("Fatura fotoğrafı yüklenemedi!")
        return
      }
    } catch (e) {
      toastError("Yükleme sırasında hata oluştu!")
      return
    }
  }

  const payload = {
    amount: newExpense.value.amount,
    ...newExpense.value,
    receiptUrl
  };

  const res = await fetch('http://localhost:3000/api/expenses', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authState.token}`
    },
    body: JSON.stringify(payload)
  })
  
  if (res.ok) {
    newExpense.value = {
      amount: '',
      description: '',
      categoryId: '',
      date: new Date().toISOString().split('T')[0],
      userId: authState.user?.id || '',
      exemptUserIds: [],
      isPeriodic: false,
      periodStart: '',
      periodEnd: '',
      isRecurring: false,
      recurringInterval: 'MONTHLY',
      recurringEndDate: ''
    }
    receiptFile.value = null
    const fileInput = document.getElementById('receiptInput') as HTMLInputElement
    if (fileInput) fileInput.value = ''
    
    // Sadece Giderları yenile
    const expRes = await fetch('http://localhost:3000/api/expenses', {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    })
    expenses.value = await expRes.json()
    
    isAdvancedModalOpen.value = false
    success("Gider başarıyla eklendi!")
  } else {
    const data = await res.json()
    toastError(data.error || 'Gider eklenemedi.')
  }
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

onMounted(() => {
  fetchInitialData()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    


    <!-- Gider Ekleme Formu -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-slate-800/50">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <PlusCircle class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Yeni Gider Ekle
        </h3>
      </div>
      
      <div class="p-6">
          <!-- 1. Satır: Temel Bilgiler (4 Sütun) -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tutar (₺)</label>
              <input v-model="newExpense.amount" type="number" step="0.01" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors" placeholder="0.00">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Kategori</label>
              <select v-model="newExpense.categoryId" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors appearance-none">
                <option value="" disabled>Kategori Seçin...</option>
                <optgroup v-for="pCat in categories.filter((c: any) => !c.parentId)" :key="pCat.id" :label="pCat.name">
                  <option :value="pCat.id">{{ pCat.name }} (Ana Kategori)</option>
                  <option v-for="cCat in categories.filter((c: any) => c.parentId === pCat.id)" :key="cCat.id" :value="cCat.id">
                    ↳ {{ cCat.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Tarih</label>
              <input v-model="newExpense.date" type="date" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ödeyen / Giren Kişi</label>
              <select v-model="newExpense.userId" :disabled="!isAdminOrSec" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors appearance-none disabled:opacity-50">
                <option v-if="isAdminOrSec" value="JOINT" class="font-bold text-emerald-600">ASM Ortak Hesap (Kasadan)</option>
                <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
            </div>
          </div>

          <!-- 2. Satır: Açıklama ve Dosya Yükleme (2 Sütun) -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Açıklama <span class="text-xs font-normal text-slate-400 ml-1">(İsteğe Bağlı)</span></label>
              <input v-model="newExpense.description" type="text" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors" placeholder="Fatura detayı vb...">
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Fatura / Fiş Yükle</label>
              <input type="file" id="receiptInput" @change="e => receiptFile = (e.target as HTMLInputElement).files?.[0] || null" accept="image/*,.pdf" class="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/30 dark:file:text-emerald-400 transition-colors cursor-pointer border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 px-2 py-1"/>
            </div>
          </div>

          <!-- 3. Satır: Gelişmiş Seçenekler Butonu -->
          <div class="flex justify-start mb-6">
            <button @click="isAdvancedModalOpen = true" class="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 px-5 py-2.5 rounded-xl transition-colors border border-emerald-200 dark:border-emerald-800/50">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Gelişmiş
              <span v-if="newExpense.isPeriodic || newExpense.exemptUserIds.length > 0 || newExpense.isRecurring" class="ml-2 flex h-2 w-2 relative">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </button>
          </div>

          <!-- Kaydet Butonu -->
          <div class="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-4">
            <button @click="addExpense" class="w-full md:w-auto bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-[0.98]">
              Giderı Kaydet
            </button>
          </div>
      </div>
    </div>



    <!-- Gelişmiş Ayarlar Modalı -->
    <div v-if="isAdvancedModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 dark:bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div class="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden" @click.stop>
        <div class="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Gelişmiş Gider Ayarları</h3>
          <button @click="isAdvancedModalOpen = false" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          <!-- Tekrarlayan Gider (Yeni Özellik) -->
          <div>
            <label class="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="checkbox" v-model="newExpense.isRecurring" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5">
              🔄 Bu Gider Düzenli Olarak Tekrarlıyor mu?
            </label>
            <div v-if="newExpense.isRecurring" class="grid grid-cols-2 gap-4 mt-3 ml-2">
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Tekrarlama Sıklığı</label>
                <select v-model="newExpense.recurringInterval" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
                  <option value="MONTHLY">Her Ay</option>
                  <option value="YEARLY">Her Yıl</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Bitiş Tarihi</label>
                <input v-model="newExpense.recurringEndDate" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
              </div>
              <div class="col-span-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                Not: "Bitiş Tarihi"ne kadar (en fazla 24 ay) her ay/yıl için ileriye dönük otomatik kayıt oluşturulur.
              </div>
            </div>
          </div>

          <!-- Dönemsel -->
          <div>
            <label class="flex items-center gap-3 text-base font-semibold text-slate-800 dark:text-slate-200 cursor-pointer bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
              <input type="checkbox" v-model="newExpense.isPeriodic" class="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-5 h-5">
              📅 Bu Gider Dönemsel mi? (Geçmişe Dönük / Yıllık Fatura)
            </label>
            <div v-if="newExpense.isPeriodic" class="grid grid-cols-2 gap-4 mt-3 ml-2">
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dönem Başlangıcı</label>
                <input v-model="newExpense.periodStart" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Dönem Bitişi</label>
                <input v-model="newExpense.periodEnd" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
              </div>
            </div>
          </div>

          <!-- Muafiyet -->
          <div v-if="users.length > 0">
            <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Bu Gidertan Muaf Olanlar</h4>
            <div class="flex flex-wrap gap-2">
              <label v-for="u in users" :key="u.id" class="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600 rounded-xl cursor-pointer transition-colors shadow-sm select-none">
                <input type="checkbox" :value="u.id" v-model="newExpense.exemptUserIds" class="rounded text-emerald-600 focus:ring-emerald-500 dark:bg-slate-900 border-slate-300 dark:border-slate-600 w-4 h-4">
                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ u.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <div class="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button @click="isAdvancedModalOpen = false" class="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all shadow-sm">
            Uygula ve Kapat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
