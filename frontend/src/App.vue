<script setup lang="ts">
import { LayoutDashboard, LogOut, UserCircle, FileText, Sun, Moon, Table, Menu, PlusCircle, List, Users, FolderKanban, Settings } from 'lucide-vue-next'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { authState, clearAuth } from './auth'
import { isDark, toggleTheme } from './theme'
import ToastProvider from './components/ToastProvider.vue'
import { ref, computed } from 'vue'

const route = useRoute()
const router = useRouter()
const isSidebarCollapsed = ref(false)
const isUserMenuOpen = ref(false)

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleUserMenu = () => {
  isUserMenuOpen.value = !isUserMenuOpen.value
}

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const logout = () => {
  clearAuth()
  router.push('/login')
}

const pageTitle = computed(() => {
  switch(route.path) {
    case '/': return 'Özet';
    case '/add': return 'Gider Ekle';
    case '/list': return 'Gider Listesi';
    case '/reports': return 'Hesap Kesim';
    case '/yearly-report': return 'Hesap Tablosu';
    case '/users': return 'Personel Yönetimi';
    case '/categories': return 'Kategoriler';
    case '/settings': return 'Ayarlar';
    default: return 'ASM Gider Takip';
  }
})
</script>

<template>
  <div v-if="authState.token" class="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
    <!-- Sidebar -->
    <aside :class="[isSidebarCollapsed ? 'w-20' : 'w-64', 'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-500 ease-in-out relative shrink-0']">
      
      <!-- Collapse Button -->
      <button @click="toggleSidebar" class="absolute -right-3 top-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full p-1 text-slate-400 hover:text-emerald-600 shadow-sm transition-colors z-10" title="Paneli Aç/Kapat">
        <Menu class="w-4 h-4" />
      </button>

      <div class="h-16 flex items-center border-b border-slate-200 dark:border-slate-800 relative w-full overflow-hidden shrink-0">
        <!-- AGT (Collapsed state) -->
        <div class="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out" :class="isSidebarCollapsed ? 'opacity-100 scale-100' : 'opacity-0 scale-50 pointer-events-none'">
          <h1 class="text-xl font-black text-emerald-600 dark:text-emerald-500 tracking-tight">AGT</h1>
        </div>
        
        <!-- ASM Gider Takip (Expanded state) -->
        <div class="absolute inset-0 flex items-center pl-6 transition-all duration-500 ease-in-out" :class="isSidebarCollapsed ? 'opacity-0 -translate-x-4 pointer-events-none' : 'opacity-100 translate-x-0'">
          <h1 class="text-xl font-bold text-emerald-600 dark:text-emerald-500 tracking-tight whitespace-nowrap">ASM Gider Takip</h1>
        </div>
      </div>
      
      <nav class="flex-1 py-4 px-3 space-y-1.5 overflow-x-hidden overflow-y-auto custom-scrollbar">

        <RouterLink 
          to="/" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Özet"
        >
          <LayoutDashboard class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Özet</span>
        </RouterLink>
        <RouterLink 
          to="/add" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/add' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Gider Ekle"
        >
          <PlusCircle class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Gider Ekle</span>
        </RouterLink>
        <RouterLink 
          to="/list" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/list' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Gider Listesi"
        >
          <List class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Gider Listesi</span>
        </RouterLink>


        <RouterLink 
          to="/reports" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/reports' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Hesap Kesim"
        >
          <FileText class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Hesap Kesim</span>
        </RouterLink>
        <RouterLink 
          to="/yearly-report" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/yearly-report' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Hesap Tablosu"
        >
          <Table class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Hesap Tablosu</span>
        </RouterLink>


        <RouterLink v-if="authState.user?.role === 'ADMIN'"
          to="/users" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/users' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Personel Yönetimi"
        >
          <Users class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Personel Yönetimi</span>
        </RouterLink>
        <RouterLink v-if="authState.user?.role === 'ADMIN'"
          to="/categories" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/categories' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Kategoriler"
        >
          <FolderKanban class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Kategoriler</span>
        </RouterLink>

        <RouterLink v-if="authState.user?.role === 'ADMIN'"
          to="/settings" 
          class="flex items-center h-11 rounded-lg transition-all duration-500 ease-in-out group"
          :class="[route.path === '/settings' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50', isSidebarCollapsed ? 'pl-[18px]' : 'pl-3']"
          title="Ayarlar"
        >
          <Settings class="w-5 h-5 shrink-0 transition-transform duration-500 group-hover:scale-110" :class="isSidebarCollapsed ? 'scale-110' : ''" />
          <span class="text-sm whitespace-nowrap transition-all duration-500 ease-in-out overflow-hidden" :class="isSidebarCollapsed ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-3'">Ayarlar</span>
        </RouterLink>
      </nav>
      

    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen overflow-hidden relative">
      <header class="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 transition-colors duration-300">
        <h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {{ pageTitle }}
        </h2>
        
        <!-- Right Header Items -->
        <div class="flex items-center gap-4 relative">
          <!-- Dark Mode Toggle -->
          <button @click="toggleTheme" class="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Temayı Değiştir">
            <Moon v-if="!isDark" class="w-5 h-5" />
            <Sun v-else class="w-5 h-5" />
          </button>

          <!-- User Dropdown -->
          <div class="relative">
            <button @click="toggleUserMenu" class="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors outline-none focus:ring-2 focus:ring-emerald-500/50">
              <UserCircle class="w-6 h-6" />
            </button>
            
            <!-- Backdrop for closing menu when clicked outside -->
            <div v-if="isUserMenuOpen" @click="closeUserMenu" class="fixed inset-0 z-20"></div>
            
            <!-- Dropdown Menu -->
            <div v-if="isUserMenuOpen" class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-30 animate-fade-in origin-top-right">
              <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
                <p class="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{{ authState.user?.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">{{ authState.user?.role }}</p>
              </div>
              <div class="p-2">
                <button @click="logout" class="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-left">
                  <LogOut class="w-4 h-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div class="flex-1 overflow-auto p-8 relative">
        <RouterView v-slot="{ Component }">
          <transition name="page-fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </div>
    </main>
  </div>
  
  <RouterView v-else />

  <ToastProvider />
</template>

<style>
/* Sayfa Geçiş Animasyonu */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
