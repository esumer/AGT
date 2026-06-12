<script setup lang="ts">
import { ref, computed } from 'vue'
import { ShieldCheck, Monitor, Network, Cloud, CheckCircle2, ArrowRight, ArrowLeft, Wifi, Copy, Server } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { setAuth } from '../auth'
import { apiUrl } from '../api'

const router = useRouter()

// Adım yönetimi: 1=senaryo seç, 2=ağ bilgisi (LAN için), 3=admin hesabı
const step = ref(1)
const selectedScenario = ref('')

const form = ref({
  name: '',
  email: '',
  password: '',
  title: 'DOKTOR'
})
const errorMsg = ref('')
const networkInfo = ref({ localIP: '', lanIP: '' })
const copied = ref(false)

// Ağ IP bilgisini backend'den çek
const fetchNetworkInfo = async () => {
  try {
    const res = await fetch(apiUrl('/api/auth/network-info'))
    if (res.ok) {
      networkInfo.value = await res.json()
    }
  } catch {}
}

const scenarios = [
  {
    id: 'local',
    icon: Monitor,
    title: 'Tek Bilgisayar',
    subtitle: 'Sadece bu bilgisayarda',
    description: 'Program yalnızca bu bilgisayarda çalışır. İnternet veya ağ bağlantısı gerekmez.',
    badge: 'En Kolay',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    color: 'emerald'
  },
  {
    id: 'lan',
    icon: Network,
    title: 'Ağ Üzerinden',
    subtitle: 'ASM\'deki diğer bilgisayarlar da bağlansın',
    description: 'Bu bilgisayar sunucu olur. Aynı ağdaki diğer bilgisayarlar tarayıcıdan bağlanabilir.',
    badge: 'Orta Düzey',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    color: 'blue'
  },
  {
    id: 'cloud',
    icon: Cloud,
    title: 'Bulut Veritabanı',
    subtitle: 'Veritabanı internette, farklı konumlardan erişim',
    description: 'Supabase veritabanı ile veriler bulutta saklanır. Farklı lokasyonlardan internet üzerinden bağlanılır.',
    badge: 'Gelişmiş',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
    color: 'purple'
  },
  {
    id: 'vps',
    icon: Server,
    title: 'Sunucuya Kur',
    subtitle: 'VPS / Uzak sunucu üzerine tam kurulum',
    description: 'Program ve veritabanı bir VPS/sunucuya kurulur. Nginx, SSL ve PM2 ile profesyonel kurulum yapılır.',
    badge: 'Uzman',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',
    color: 'rose'
  }
]

const selectScenario = async (id: string) => {
  selectedScenario.value = id
  if (id === 'lan') {
    await fetchNetworkInfo()
    step.value = 2
  } else if (id === 'cloud' || id === 'vps') {
    step.value = 2
  } else {
    step.value = 3
  }
}

const copyIP = (ip: string) => {
  navigator.clipboard.writeText(ip)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

const doSetup = async () => {
  errorMsg.value = ''
  if (!form.value.name || !form.value.email || !form.value.password) {
    errorMsg.value = 'Lütfen tüm alanları doldurun.'
    return
  }
  try {
    const res = await fetch(apiUrl('/api/auth/setup'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    const data = await res.json()
    if (!res.ok) {
      errorMsg.value = data.error || 'Kurulum başarısız.'
      return
    }
    setAuth(data.token, data.user)
    router.push('/')
  } catch (e) {
    errorMsg.value = 'Sunucu ile bağlantı kurulamadı.'
  }
}

const stepTitle = computed(() => {
  if (step.value === 1) return 'Nasıl kullanmak istiyorsunuz?'
  if (step.value === 2 && selectedScenario.value === 'lan') return 'Ağ Erişimi Hazır'
  if (step.value === 2 && selectedScenario.value === 'cloud') return 'Bulut Kurulumu'
  if (step.value === 2 && selectedScenario.value === 'vps') return 'Sunucu Kurulumu (VPS)'
  return 'Yönetici Hesabı Oluştur'
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-300">

    <!-- Logo / Header -->
    <div class="text-center mb-8">
      <div class="w-16 h-16 bg-emerald-600 dark:bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
        <ShieldCheck class="w-9 h-9 text-white" />
      </div>
      <h1 class="text-2xl font-bold text-slate-800 dark:text-slate-100">ASM Gider Takip</h1>
      <p class="text-slate-500 dark:text-slate-400 text-sm mt-1">İlk Kurulum</p>
    </div>

    <!-- Adım göstergesi -->
    <div class="flex items-center gap-2 mb-8">
      <div v-for="i in 3" :key="i" class="flex items-center gap-2">
        <div :class="[
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
          step > i ? 'bg-emerald-600 text-white' : step === i ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 dark:ring-emerald-900/50' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
        ]">
          <CheckCircle2 v-if="step > i" class="w-4 h-4" />
          <span v-else>{{ i }}</span>
        </div>
        <div v-if="i < 3" :class="['w-8 h-0.5 transition-all duration-300', step > i ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700']"></div>
      </div>
    </div>

    <!-- Kart -->
    <div class="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">

      <!-- Başlık -->
      <div class="px-8 pt-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div class="flex items-center gap-3">
          <button v-if="step > 1" @click="step--" class="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-500">
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <p class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Adım {{ step }} / 3</p>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ stepTitle }}</h2>
          </div>
        </div>
      </div>

      <!-- ===== ADIM 1: Senaryo Seçimi ===== -->
      <div v-if="step === 1" class="p-8">
        <p class="text-slate-500 dark:text-slate-400 mb-6">Programı nasıl kullanacağınıza göre en uygun kurulum seçeneğini seçin:</p>
        <div class="space-y-4">
          <button
            v-for="scenario in scenarios"
            :key="scenario.id"
            @click="selectScenario(scenario.id)"
            :class="[
              'w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group hover:shadow-md',
              selectedScenario === scenario.id
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 bg-white dark:bg-slate-800/50'
            ]"
          >
            <div class="flex items-start gap-4">
              <div :class="[
                'w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
                scenario.id === 'local' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' :
                scenario.id === 'lan'   ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' :
                                          'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
              ]">
                <component :is="scenario.icon" class="w-6 h-6" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-bold text-slate-800 dark:text-slate-100">{{ scenario.title }}</span>
                  <span :class="['text-xs font-semibold px-2 py-0.5 rounded-full', scenario.badgeColor]">{{ scenario.badge }}</span>
                </div>
                <p class="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">{{ scenario.subtitle }}</p>
                <p class="text-sm text-slate-500 dark:text-slate-400">{{ scenario.description }}</p>
              </div>
              <ArrowRight class="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-3" />
            </div>
          </button>
        </div>
      </div>

      <!-- ===== ADIM 2: LAN Bilgisi ===== -->
      <div v-else-if="step === 2 && selectedScenario === 'lan'" class="p-8">
        <div class="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 mb-6">
          <Wifi class="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p class="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            Ağ erişimi için bu bilgisayar sunucu olacak. Diğer bilgisayarlar aşağıdaki adresi kullanacak.
          </p>
        </div>

        <div class="space-y-4 mb-6">
          <div class="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Bu bilgisayarda</p>
            <div class="flex items-center justify-between gap-2">
              <code class="text-lg font-bold text-slate-800 dark:text-slate-100">http://localhost:3000</code>
            </div>
          </div>

          <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
            <p class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Ağdaki diğer bilgisayarlarda</p>
            <div class="flex items-center justify-between gap-2">
              <code class="text-lg font-bold text-slate-800 dark:text-slate-100">
                http://{{ networkInfo.lanIP || '192.168.x.x' }}:3000
              </code>
              <button @click="copyIP('http://' + networkInfo.lanIP + ':3000')" class="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors">
                <Copy class="w-3.5 h-3.5" />
                {{ copied ? 'Kopyalandı!' : 'Kopyala' }}
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800 mb-6">
          <p class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">⚠️ Kurulum sonrasında yapmanız gerekenler:</p>
          <ol class="text-sm text-amber-700 dark:text-amber-400 space-y-1.5 list-decimal list-inside">
            <li>Yönetici olarak <strong>lan-yapilandir.bat</strong>'ı çalıştırın (güvenlik duvarı açılır)</li>
            <li>Bu bilgisayara sabit IP adresi atayın</li>
            <li>Açılışta otomatik başlaması için <strong>nssm-servis-kur.bat</strong>'ı çalıştırın</li>
          </ol>
        </div>

        <button @click="step = 3" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none">
          Devam Et — Yönetici Hesabı Oluştur
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>

      <!-- ===== ADIM 2: Bulut (Supabase) ===== -->
      <div v-else-if="step === 2 && selectedScenario === 'cloud'" class="p-8">
        <div class="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 mb-6">
          <p class="text-sm text-purple-800 dark:text-purple-300 font-medium">
            Bulut veritabanı kurulumu manuel adımlar gerektirir. Lütfen <strong>README-DAĞITIM.md</strong> dosyasındaki Senaryo 3 adımlarını takip edin.
          </p>
        </div>
        <ol class="space-y-3 mb-6">
          <li v-for="(item, i) in [
            { step: '1', text: 'supabase.com\'da ücretsiz hesap açın' },
            { step: '2', text: 'Yeni proje oluşturun ve veritabanı URL\'sini kopyalayın' },
            { step: '3', text: 'backend/.env dosyasına DATABASE_URL ekleyin' },
            { step: '4', text: 'Prisma schema\'yı PostgreSQL\'e çevirin' },
            { step: '5', text: 'npx prisma db push ile tabloları oluşturun' }
          ]" :key="i" class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ item.step }}</span>
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ item.text }}</span>
          </li>
        </ol>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">Supabase kurulumunu tamamladıktan sonra sunucuyu yeniden başlatın ve buraya gelin.</p>
        <button @click="step = 3" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-200 dark:shadow-none">
          Şimdilik Atla — Yönetici Hesabı Oluştur
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>

      <!-- ===== ADIM 2: VPS / Sunucu ===== -->
      <div v-else-if="step === 2 && selectedScenario === 'vps'" class="p-8">
        <div class="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-200 dark:border-rose-800 mb-6">
          <Server class="w-6 h-6 text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <p class="text-sm text-rose-700 dark:text-rose-300 font-medium">
            Bu seçenek Linux tabanlı VPS/sunucu bilgisi gerektirir. Sistem yöneticisi deneyimi önerilir.
          </p>
        </div>
        <ol class="space-y-3 mb-6">
          <li v-for="(item, i) in [
            { step: '1', text: 'VPS sunucuya SSH ile bağlanın (Ubuntu/Debian önerilir)' },
            { step: '2', text: 'Node.js 18+, Git ve PM2 kurun' },
            { step: '3', text: 'Projeyi git clone ile sunucuya alın' },
            { step: '4', text: 'backend/.env dosyasını sunucu için düzenleyin' },
            { step: '5', text: 'kur.bat yerine: npm install + npx prisma db push + npm run build' },
            { step: '6', text: 'PM2 ile başlatın: pm2 start npm --name asm -- run start' },
            { step: '7', text: 'Nginx ile reverse proxy ve SSL (Certbot) kurun' }
          ]" :key="i" class="flex items-start gap-3">
            <span class="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{{ item.step }}</span>
            <span class="text-sm text-slate-600 dark:text-slate-300">{{ item.text }}</span>
          </li>
        </ol>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Sunucu kurulumunu tamamladıktan sonra o sunucunun IP/domain adresinden bu sayfaya erişin.
        </p>
        <button @click="step = 3" class="w-full bg-rose-600 hover:bg-rose-700 text-white py-3.5 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-200 dark:shadow-none">
          Şimdilik Atla — Yönetici Hesabı Oluştur
          <ArrowRight class="w-5 h-5" />
        </button>
      </div>

      <!-- ===== ADIM 3: Admin Hesabı ===== -->
      <div v-else-if="step === 3" class="p-8">
        <p class="text-slate-500 dark:text-slate-400 mb-6">
          Sistemi yönetmek için ilk admin hesabını oluşturun.
        </p>
        <div class="space-y-4">
          <div v-if="errorMsg" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900">
            {{ errorMsg }}
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ad Soyad</label>
            <input v-model="form.name" type="text"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="Dr. Ali Yılmaz">
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">E-posta</label>
            <input v-model="form.email" type="email"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="ali@asm.com">
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Ünvanınız</label>
            <select v-model="form.title"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors">
              <option value="DOKTOR">Doktor</option>
              <option value="TIBBİ SEKRETER">Tıbbi Sekreter</option>
              <option value="HEMŞİRE">Hemşire</option>
              <option value="EBE">Ebe</option>
              <option value="ASE">ASE</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-semibold text-slate-600 dark:text-slate-300 mb-1.5">Şifre</label>
            <input v-model="form.password" type="password"
              class="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors"
              placeholder="••••••••">
          </div>

          <button @click="doSetup"
            class="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white py-3.5 rounded-xl font-bold transition-colors shadow-lg shadow-emerald-200 dark:shadow-none mt-2 flex items-center justify-center gap-2">
            <CheckCircle2 class="w-5 h-5" />
            Kurulumu Tamamla
          </button>
        </div>
      </div>

    </div>

    <p class="text-xs text-slate-400 dark:text-slate-600 mt-6">ASM Gider Takip v1.0</p>
  </div>
</template>
