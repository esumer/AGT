<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Users, Trash2, Database, Cloud, HardDrive, ArrowRightLeft, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import { authState } from '../auth'
import { useToast } from '../composables/useToast'
import { apiUrl } from '../api'

const { success, error: toastError } = useToast()

const users = ref<any[]>([])
const newUser = ref({ name: '', email: '', password: '', role: 'USER', title: 'DOKTOR', isPartner: true, startDate: '' })

// ── Veritabanı Senaryo Yönetimi ──────────────────────────────
const dbConfig = ref<{ provider: string; displayUrl: string } | null>(null)
const selectedScenario = ref<'sqlite' | 'postgresql'>('sqlite')
const dbFormOpen = ref(false)
const newDbUrl = ref('')
const newDirectUrl = ref('')
const testStatus = ref<'idle' | 'loading' | 'ok' | 'fail'>('idle')
const testError = ref('')
const migrating = ref(false)
const migrationLogs = ref<string[]>([])
const migrationDone = ref(false)
const migrationError = ref('')

const fetchDbConfig = async () => {
  try {
    const res = await fetch(apiUrl('/api/admin/db-config'), {
      headers: { 'Authorization': `Bearer ${authState.token}` }
    })
    if (res.ok) {
      dbConfig.value = await res.json()
      selectedScenario.value = dbConfig.value!.provider as 'sqlite' | 'postgresql'
    }
  } catch {}
}

const selectScenario = (s: 'sqlite' | 'postgresql') => {
  selectedScenario.value = s
  dbFormOpen.value = s !== dbConfig.value?.provider
  testStatus.value = 'idle'
  testError.value = ''
  migrationLogs.value = []
  migrationDone.value = false
  migrationError.value = ''
}

const testConnection = async () => {
  if (!newDbUrl.value.trim()) return toastError('Bağlantı URL\'si gerekli')
  testStatus.value = 'loading'
  testError.value = ''
  const direction = selectedScenario.value === 'postgresql' ? 'to-postgresql' : 'to-sqlite'
  try {
    const res = await fetch(apiUrl('/api/admin/db-config/test'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
      body: JSON.stringify({ targetUrl: newDbUrl.value.trim(), directUrl: newDirectUrl.value.trim(), direction })
    })
    const data = await res.json()
    if (res.ok && data.success) {
      testStatus.value = 'ok'
    } else {
      testStatus.value = 'fail'
      testError.value = data.error || 'Bağlantı başarısız'
    }
  } catch {
    testStatus.value = 'fail'
    testError.value = 'Sunucuya ulaşılamadı'
  }
}

const startMigration = async () => {
  migrating.value = true
  migrationLogs.value = []
  migrationDone.value = false
  migrationError.value = ''
  const direction = selectedScenario.value === 'postgresql' ? 'to-postgresql' : 'to-sqlite'
  const targetUrl = selectedScenario.value === 'sqlite' ? 'file:./prisma/dev.db' : newDbUrl.value.trim()
  const directUrl = selectedScenario.value === 'sqlite' ? '' : newDirectUrl.value.trim()

  try {
    const res = await fetch(apiUrl('/api/admin/db-migrate'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
      body: JSON.stringify({ targetUrl, directUrl, direction })
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const { type, msg } = JSON.parse(line.slice(6))
            if (type === 'done') { migrationDone.value = true; fetchDbConfig() }
            else if (type === 'error') { migrationError.value = msg }
            else if (msg) migrationLogs.value.push(msg)
          } catch {}
        }
      }
    }
  } catch (e: any) {
    migrationError.value = e.message
  } finally {
    migrating.value = false
  }
}
// ───────────────────────────────────────────────────────────
const fetchSettingsData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const uRes = await fetch(apiUrl('/api/users'), { headers })
  if (uRes.ok) {
    const rawUsers = await uRes.json()
    users.value = rawUsers.map((u: any) => ({
      ...u,
      startDate: u.startDate ? new Date(u.startDate).toISOString().split('T')[0] : ''
    }))
  }
}

const addUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) return toastError('Tüm alanları doldurun')
  
  const res = await fetch(apiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
    body: JSON.stringify(newUser.value)
  })
  if (res.ok) {
    newUser.value = { name: '', email: '', password: '', role: 'USER', title: 'DOKTOR', isPartner: true, startDate: '' }
    success('Kullanıcı eklendi')
    fetchSettingsData()
  } else {
    toastError('Kullanıcı eklenemedi')
  }
}

const updateUser = async (user: any) => {
  if (user.id === authState.user?.id && user.role !== 'ADMIN') {
    toastError("Kendi yetkinizi düşüremezsiniz.");
    fetchSettingsData();
    return;
  }
  
  const res = await fetch(apiUrl(`/api/users/${user.id}`), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
    body: JSON.stringify({ role: user.role, title: user.title, isPartner: user.isPartner, startDate: user.startDate })
  })
  if (!res.ok) {
    toastError("Kullanıcı güncellenemedi.");
  } else {
    success("Kullanıcı güncellendi.");
  }
  fetchSettingsData();
}

const deleteUser = async (id: number) => {
  if(!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return
  const res = await fetch(apiUrl(`/api/users/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authState.token}` }
  })
  if (res.ok) {
    success('Kullanıcı silindi')
    fetchSettingsData()
  } else {
    toastError('Kullanıcı silinemedi')
  }
}

onMounted(() => {
  fetchSettingsData()
  if (authState.user?.role === 'ADMIN') fetchDbConfig()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    
    <!-- ── Veritabanı & Senaryo Yönetimi (sadece ADMIN) ── -->
    <div v-if="authState.user?.role === 'ADMIN'" class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Database class="w-5 h-5 text-violet-600 dark:text-violet-400" />
          Veritabanı & Senaryo
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Verilerin nerede saklanacağını seçin. Değişiklik otomatik taşıma yapar.</p>
      </div>

      <div class="p-6">
        <!-- Mevcut durum rozeti -->
        <div v-if="dbConfig" class="flex items-center gap-2 mb-6">
          <span class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aktif:</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
            :class="dbConfig.provider === 'postgresql'
              ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300'
              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'">
            <Cloud v-if="dbConfig.provider === 'postgresql'" class="w-3.5 h-3.5" />
            <HardDrive v-else class="w-3.5 h-3.5" />
            {{ dbConfig.provider === 'postgresql' ? 'Supabase (Bulut)' : 'SQLite (Yerel Dosya)' }}
          </span>
          <span v-if="dbConfig.provider === 'postgresql'" class="text-xs text-slate-400 dark:text-slate-500 font-mono truncate max-w-xs">{{ dbConfig.displayUrl }}</span>
        </div>
        <div v-else class="flex items-center gap-2 mb-6">
          <RefreshCw class="w-4 h-4 text-slate-400 animate-spin" />
          <span class="text-sm text-slate-400">Yükleniyor...</span>
        </div>

        <!-- Senaryo seçim kartları -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <!-- Senaryo 1/2: SQLite -->
          <button @click="selectScenario('sqlite')"
            class="text-left p-5 rounded-2xl border-2 transition-all duration-200"
            :class="selectedScenario === 'sqlite'
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800/50'">
            <div class="flex items-start justify-between mb-3">
              <div class="p-2 rounded-xl" :class="selectedScenario === 'sqlite' ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-slate-100 dark:bg-slate-700'">
                <HardDrive class="w-5 h-5" :class="selectedScenario === 'sqlite' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'" />
              </div>
              <span v-if="dbConfig?.provider === 'sqlite'" class="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full">Aktif</span>
              <div v-else class="w-4 h-4 rounded-full border-2 mt-1"
                :class="selectedScenario === 'sqlite' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-slate-600'" />
            </div>
            <h4 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Senaryo 1 / 2 — Yerel</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Bu bilgisayarda veya ağda çalışır. Kurulum gerektirmez.</p>
            <code class="text-xs text-slate-400 dark:text-slate-500 mt-2 block">file:./prisma/dev.db</code>
          </button>

          <!-- Senaryo 3: Supabase -->
          <button @click="selectScenario('postgresql')"
            class="text-left p-5 rounded-2xl border-2 transition-all duration-200"
            :class="selectedScenario === 'postgresql'
              ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
              : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 bg-white dark:bg-slate-800/50'">
            <div class="flex items-start justify-between mb-3">
              <div class="p-2 rounded-xl" :class="selectedScenario === 'postgresql' ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-slate-100 dark:bg-slate-700'">
                <Cloud class="w-5 h-5" :class="selectedScenario === 'postgresql' ? 'text-violet-600 dark:text-violet-400' : 'text-slate-500 dark:text-slate-400'" />
              </div>
              <span v-if="dbConfig?.provider === 'postgresql'" class="text-xs font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 rounded-full">Aktif</span>
              <div v-else class="w-4 h-4 rounded-full border-2 mt-1"
                :class="selectedScenario === 'postgresql' ? 'border-violet-500 bg-violet-500' : 'border-slate-300 dark:border-slate-600'" />
            </div>
            <h4 class="font-bold text-slate-800 dark:text-slate-100 mb-1">Senaryo 3 — Supabase Bulut</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">Veriler internette saklanır. Farklı lokasyondan erişilebilir.</p>
            <code class="text-xs text-slate-400 dark:text-slate-500 mt-2 block">supabase.com → ücretsiz</code>
          </button>
        </div>

        <!-- Supabase URL formu -->
        <div v-if="dbFormOpen && selectedScenario === 'postgresql'" class="space-y-4 p-5 bg-violet-50 dark:bg-violet-900/10 rounded-2xl border border-violet-200 dark:border-violet-800 mb-4">
          <p class="text-sm font-semibold text-violet-800 dark:text-violet-300">Supabase Bağlantı Bilgileri</p>
          <p class="text-xs text-violet-600 dark:text-violet-400">Supabase → Project Settings → Database → Connection String bölümünden kopyalayın.</p>
          <div>
            <label class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Database URL (Pooler — Transaction)</label>
            <input v-model="newDbUrl" type="text" placeholder="postgresql://postgres.xxxx:password@...pooler.supabase.com:6543/postgres"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-violet-500 text-slate-800 dark:text-slate-100" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">Direct URL (Direkt Bağlantı — Migrasyon için)</label>
            <input v-model="newDirectUrl" type="text" placeholder="postgresql://postgres.xxxx:password@db.xxxx.supabase.co:5432/postgres"
              class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono outline-none focus:ring-2 focus:ring-violet-500 text-slate-800 dark:text-slate-100" />
          </div>
          <!-- Test sonucu -->
          <div v-if="testStatus !== 'idle'"
            :class="testStatus === 'ok' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                  : testStatus === 'fail' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500'"
            class="p-3 rounded-xl border text-sm flex items-start gap-2">
            <RefreshCw v-if="testStatus === 'loading'" class="w-4 h-4 animate-spin flex-shrink-0 mt-0.5" />
            <CheckCircle2 v-else-if="testStatus === 'ok'" class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <AlertTriangle v-else class="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{{ testStatus === 'loading' ? 'Test ediliyor...' : testStatus === 'ok' ? 'Bağlantı başarılı!' : testError }}</span>
          </div>
          <div class="flex gap-3">
            <button @click="testConnection" :disabled="testStatus === 'loading' || migrating"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors border-2 border-violet-400 text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/30 disabled:opacity-50">
              <RefreshCw class="w-4 h-4" :class="testStatus === 'loading' ? 'animate-spin' : ''" />
              Bağlantıyı Test Et
            </button>
            <button @click="startMigration" :disabled="testStatus !== 'ok' || migrating"
              class="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-colors shadow-sm disabled:opacity-50"
              :class="testStatus === 'ok' && !migrating ? 'bg-violet-600 hover:bg-violet-700' : 'bg-slate-400'">
              <ArrowRightLeft class="w-4 h-4" />
              {{ migrating ? 'Geçiş Yapılıyor...' : 'Supabase\'e Geç & Taşı' }}
            </button>
          </div>
        </div>

        <!-- SQLite'a geri dön -->
        <div v-if="dbFormOpen && selectedScenario === 'sqlite' && dbConfig?.provider === 'postgresql'" class="p-5 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-4">
          <p class="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Yerel Dosyaya Geri Dön</p>
          <p class="text-xs text-emerald-700 dark:text-emerald-400 mb-4">Supabase'deki tüm veriler bu bilgisayardaki dosyaya taşınacak.</p>
          <button @click="startMigration" :disabled="migrating"
            class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
            <ArrowRightLeft class="w-4 h-4" />
            {{ migrating ? 'Taşınıyor...' : 'Yerel Dosyaya Geri Taşı' }}
          </button>
        </div>

        <!-- İlerleme logu -->
        <div v-if="migrationLogs.length > 0 || migrating" class="mt-4 p-4 bg-slate-900 dark:bg-slate-950 rounded-2xl border border-slate-700">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">İlerleme</p>
          <div class="space-y-1.5 font-mono text-sm">
            <div v-for="(log, i) in migrationLogs" :key="i"
              :class="log.startsWith('❌') ? 'text-red-400' : log.startsWith('✅') ? 'text-emerald-400' : 'text-slate-300'">
              {{ log }}
            </div>
            <div v-if="migrating && !migrationDone && !migrationError" class="flex items-center gap-2 text-violet-400">
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              İşlem devam ediyor...
            </div>
          </div>
        </div>

        <!-- Tamamlandı -->
        <div v-if="migrationDone" class="mt-4 p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <div class="flex items-start gap-3">
            <CheckCircle2 class="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-bold text-emerald-800 dark:text-emerald-300">Geçiş tamamlandı!</p>
              <p class="text-sm text-emerald-700 dark:text-emerald-400 mt-1">Değişikliklerin aktif olması için sunucuyu yeniden başlatın.</p>
              <div class="mt-3 p-3 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
                <p class="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Yapmanız gereken:</p>
                <ol class="text-xs text-emerald-700 dark:text-emerald-400 mt-1 space-y-1 list-decimal list-inside">
                  <li><strong>baslat.bat</strong> penceresini kapatın</li>
                  <li><strong>baslat.bat</strong>'ı tekrar çalıştırın</li>
                  <li>Tarayıcıyı yenileyin</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- Hata -->
        <div v-if="migrationError" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
          <div class="flex items-start gap-2">
            <AlertTriangle class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-semibold text-red-800 dark:text-red-300">Geçiş başarısız</p>
              <p class="text-xs text-red-700 dark:text-red-400 mt-1 font-mono">{{ migrationError }}</p>
              <p class="text-xs text-red-600 dark:text-red-500 mt-2">Eski yapılandırma korunuyor.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Kullanıcılar Yönetimi -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Users class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Kullanıcı ve Personel Yönetimi
        </h3>
      </div>
      
      <!-- Kullanıcı Ekleme Formu -->
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900" v-if="authState.user?.role === 'ADMIN'">
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
          <div class="md:col-span-2">
            <input v-model="newUser.name" type="text" placeholder="Ad Soyad" class="w-full mb-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
            <input v-model="newUser.email" type="email" placeholder="E-posta" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
          </div>
          <div class="md:col-span-2">
            <input v-model="newUser.password" type="password" placeholder="Şifre" class="w-full mb-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
            <select v-model="newUser.title" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
              <option value="DOKTOR">Doktor</option>
              <option value="TIBBİ SEKRETER">Tıbbi Sekreter</option>
              <option value="HEMŞİRE">Hemşire</option>
              <option value="EBE">Ebe</option>
              <option value="ASE">ASE</option>
            </select>
          </div>
          <div class="md:col-span-1">
            <select v-model="newUser.role" class="w-full mb-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
              <option value="USER">Kullanıcı</option>
              <option value="ADMIN">Yönetici</option>
            </select>
            <input v-model="newUser.startDate" type="date" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors text-sm" title="İşe Başlama Tarihi">
            <label class="flex items-center gap-2 mt-3 px-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" v-model="newUser.isPartner" class="rounded text-emerald-600 focus:ring-emerald-500">
              Gider Ortağı
            </label>
          </div>
          <div class="md:col-span-1 flex flex-col justify-end h-full">
            <button @click="addUser" class="w-full h-full min-h-[46px] bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-sm">Ekle</button>
          </div>
        </div>
      </div>
      
      <!-- Kullanıcı Listesi Tablosu -->
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th class="px-6 py-4">Personel Bilgisi</th>
              <th class="px-6 py-4">Ünvan</th>
              <th class="px-6 py-4">Yetki</th>
              <th class="px-6 py-4">İşe Başlama</th>
              <th class="px-6 py-4 text-center">Gider Ortağı</th>
              <th class="px-6 py-4">İşlem</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
              <td class="px-6 py-4">
                <p class="font-bold text-slate-800 dark:text-slate-200">{{ user.name }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ user.email }}</p>
              </td>
              <td class="px-6 py-4">
                <select 
                  v-model="user.title" 
                  @change="updateUser(user)"
                  :disabled="authState.user?.role !== 'ADMIN'"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none disabled:opacity-50 transition-colors text-slate-800 dark:text-slate-200"
                >
                  <option value="DOKTOR">DOKTOR</option>
                  <option value="TIBBİ SEKRETER">TIBBİ SEKRETER</option>
                  <option value="HEMŞİRE">HEMŞİRE</option>
                  <option value="EBE">EBE</option>
                  <option value="ASE">ASE</option>
                </select>
              </td>
              <td class="px-6 py-4">
                <select 
                  v-model="user.role" 
                  @change="updateUser(user)"
                  :disabled="authState.user?.role !== 'ADMIN' || user.id === authState.user?.id"
                  class="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium outline-none disabled:opacity-50 transition-colors"
                  :class="user.role === 'ADMIN' ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'"
                >
                  <option value="USER">KULLANICI</option>
                  <option value="ADMIN">YÖNETİCİ</option>
                </select>
              </td>
              <td class="px-6 py-4">
                <input 
                  type="date" 
                  v-model="user.startDate" 
                  @change="updateUser(user)"
                  :disabled="authState.user?.role !== 'ADMIN'"
                  class="px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50"
                >
              </td>
              <td class="px-6 py-4 text-center">
                <input 
                  type="checkbox" 
                  v-model="user.isPartner" 
                  @change="updateUser(user)"
                  :disabled="authState.user?.role !== 'ADMIN'"
                  class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                >
              </td>
              <td class="px-6 py-4 text-right">
                <button v-if="authState.user?.role === 'ADMIN' && user.id !== authState.user?.id" @click="deleteUser(user.id)" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-2">
                  <Trash2 class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>



  </div>
</template>
