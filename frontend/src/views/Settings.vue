<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Settings2, Users, FolderKanban, ShieldCheck, Trash2 } from 'lucide-vue-next'
import { authState } from '../auth'
import { useToast } from '../composables/useToast'

const { success, error: toastError } = useToast()

const users = ref([])
const categories = ref([])

const newUser = ref({ name: '', email: '', password: '', role: 'USER', title: 'DOKTOR', isPartner: true, startDate: '' })
const newCategory = ref({ name: '' })

const fetchSettingsData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const [uRes, cRes] = await Promise.all([
    fetch('http://localhost:3000/api/users', { headers }),
    fetch('http://localhost:3000/api/categories', { headers })
  ])
  if (uRes.ok) {
    const rawUsers = await uRes.json()
    users.value = rawUsers.map(u => ({
      ...u,
      startDate: u.startDate ? new Date(u.startDate).toISOString().split('T')[0] : ''
    }))
  }
  if (cRes.ok) categories.value = await cRes.json()
}

const addUser = async () => {
  if (!newUser.value.name || !newUser.value.email || !newUser.value.password) return toastError('Tüm alanları doldurun')
  
  const res = await fetch('http://localhost:3000/api/users', {
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
  
  const res = await fetch(`http://localhost:3000/api/users/${user.id}`, {
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
  const res = await fetch(`http://localhost:3000/api/users/${id}`, {
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

const addCategory = async () => {
  if (!newCategory.value.name) return
  const res = await fetch('http://localhost:3000/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
    body: JSON.stringify(newCategory.value)
  })
  if (res.ok) {
    newCategory.value.name = ''
    fetchSettingsData()
  }
}

const deleteCategory = async (id: number) => {
  if(!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
  const res = await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authState.token}` }
  })
  if (res.ok) fetchSettingsData()
}

onMounted(() => {
  fetchSettingsData()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    
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

    <!-- Kategoriler Yönetimi -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FolderKanban class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Gider Kategorileri
        </h3>
      </div>
      
      <div class="p-6 border-b border-slate-100 dark:border-slate-800" v-if="authState.user?.role === 'ADMIN'">
        <div class="flex gap-4">
          <input v-model="newCategory.name" type="text" placeholder="Yeni kategori adı..." class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
          <button @click="addCategory" class="bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-8 py-2.5 rounded-xl font-bold transition-colors">Ekle</button>
        </div>
      </div>
      
      <div class="p-0">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
          <div v-for="cat in categories" :key="cat.id" class="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors">
            <span class="font-medium text-slate-700 dark:text-slate-300">{{ cat.name }}</span>
            <button v-if="authState.user?.role === 'ADMIN'" @click="deleteCategory(cat.id)" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
