<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { FolderKanban, Trash2, Edit2, GripVertical, Check, X } from 'lucide-vue-next'
import draggable from 'vuedraggable'
import { authState } from '../auth'
import { useToast } from '../composables/useToast'

const { success, error: toastError } = useToast()

const categories = ref([])
const nestedCategories = ref([])
const newCategory = ref({ name: '', parentId: null })

const editingId = ref(null)
const editingName = ref('')

const fetchSettingsData = async () => {
  const headers = { 'Authorization': `Bearer ${authState.token}` }
  const cRes = await fetch('http://localhost:3000/api/categories', { headers })
  if (cRes.ok) {
    const raw = await cRes.json()
    categories.value = raw
    
    const pCats = raw.filter((c: any) => !c.parentId).sort((a: any, b: any) => a.order - b.order)
    nestedCategories.value = pCats.map((p: any) => ({
      ...p,
      children: raw.filter((c: any) => c.parentId === p.id).sort((a: any, b: any) => a.order - b.order)
    }))
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
    newCategory.value.parentId = null
    fetchSettingsData()
    success('Kategori eklendi')
  } else {
    toastError('Kategori eklenemedi')
  }
}

const deleteCategory = async (id: number) => {
  if(!confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) return
  const res = await fetch(`http://localhost:3000/api/categories/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authState.token}` }
  })
  if (res.ok) {
    fetchSettingsData()
    success('Kategori silindi')
  }
}

const startEdit = (cat: any) => {
  editingId.value = cat.id
  editingName.value = cat.name
}

const cancelEdit = () => {
  editingId.value = null
  editingName.value = ''
}

const saveEdit = async (cat: any) => {
  if (!editingName.value || editingName.value === cat.name) {
    cancelEdit()
    return
  }
  const res = await fetch(`http://localhost:3000/api/categories/${cat.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
    body: JSON.stringify({ name: editingName.value })
  })
  if (res.ok) {
    cat.name = editingName.value
    cancelEdit()
    success('İsim güncellendi')
  } else {
    toastError('İsim güncellenemedi')
  }
}

const onDragEnd = async () => {
  const flatArray: any[] = []
  nestedCategories.value.forEach((p: any, pIndex: number) => {
    flatArray.push({ id: p.id, parentId: null, order: pIndex })
    if (p.children) {
      p.children.forEach((c: any, cIndex: number) => {
        flatArray.push({ id: c.id, parentId: p.id, order: cIndex })
      })
    }
  })
  
  const res = await fetch('http://localhost:3000/api/categories/reorder', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authState.token}` },
    body: JSON.stringify({ categories: flatArray })
  })
  
  if (res.ok) {
    // Optionally fetch again or just trust local state
  } else {
    toastError('Sıralama kaydedilemedi')
    fetchSettingsData() // revert
  }
}


onMounted(() => {
  fetchSettingsData()
})
</script>

<template>
  <div class="space-y-8 max-w-5xl mx-auto transition-colors duration-300">
    <!-- Kategoriler Yönetimi -->
    <div class="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FolderKanban class="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          Gider Kategorileri
        </h3>
      </div>
      
      <div class="p-6 border-b border-slate-100 dark:border-slate-800" v-if="authState.user?.role === 'ADMIN'">
        <div class="flex flex-col md:flex-row gap-4 w-full items-center">
          <input v-model="newCategory.name" type="text" placeholder="Yeni kategori adı..." class="flex-1 w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 dark:text-slate-100 transition-colors">
          <select v-model="newCategory.parentId" class="w-full md:w-64 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 outline-none transition-colors">
            <option :value="null">Ana Kategori (Üst)</option>
            <option v-for="pCat in categories.filter((c: any) => !c.parentId)" :key="pCat.id" :value="pCat.id">↳ {{ pCat.name }} Altına Ekle</option>
          </select>
          <button @click="addCategory" class="w-full md:w-auto bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white px-8 py-2.5 rounded-xl font-bold transition-colors shadow-sm">Ekle</button>
        </div>
      </div>
      
      <div class="p-0">
        <div class="flex flex-col gap-6 p-6">
          <draggable 
            v-model="nestedCategories" 
            group="categories" 
            item-key="id" 
            handle=".drag-handle" 
            @end="onDragEnd"
            class="flex flex-col gap-6"
            ghost-class="opacity-50"
          >
            <template #item="{ element: pCat }">
              <div class="flex flex-col gap-3">
                <!-- Ana Kategori -->
                <div class="flex items-center justify-between px-5 py-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-sm group">
                  <div class="flex items-center gap-3 flex-1">
                    <GripVertical v-if="authState.user?.role === 'ADMIN'" class="w-5 h-5 text-slate-400 cursor-grab active:cursor-grabbing drag-handle hover:text-emerald-500 transition-colors" />
                    <FolderKanban v-else class="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                    
                    <template v-if="editingId === pCat.id">
                      <input v-model="editingName" type="text" class="flex-1 px-3 py-1 text-sm rounded border border-emerald-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none" @keyup.enter="saveEdit(pCat)" @keyup.esc="cancelEdit" autofocus>
                      <button @click="saveEdit(pCat)" class="text-emerald-600 hover:text-emerald-700 p-1"><Check class="w-4 h-4" /></button>
                      <button @click="cancelEdit" class="text-slate-400 hover:text-slate-600 p-1"><X class="w-4 h-4" /></button>
                    </template>
                    <span v-else class="font-bold text-slate-800 dark:text-slate-100 text-lg">
                      {{ pCat.name }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-2" v-if="authState.user?.role === 'ADMIN' && editingId !== pCat.id">
                    <button @click="startEdit(pCat)" class="text-slate-400 hover:text-emerald-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 class="w-4 h-4" />
                    </button>
                    <button @click="deleteCategory(pCat.id)" class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 class="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <!-- Alt Kategoriler Draggable -->
                <draggable 
                  v-model="pCat.children" 
                  group="categories" 
                  item-key="id" 
                  handle=".drag-handle" 
                  @end="onDragEnd"
                  class="flex flex-col gap-2 pl-8 md:pl-12 min-h-[40px] mt-2"
                  ghost-class="opacity-50"
                >
                  <template #item="{ element: cCat }">
                    <div class="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors hover:border-emerald-200 dark:hover:border-emerald-900 group shadow-sm">
                      <div class="flex items-center gap-3 flex-1 overflow-hidden">
                        <GripVertical v-if="authState.user?.role === 'ADMIN'" class="w-4 h-4 text-slate-300 cursor-grab active:cursor-grabbing drag-handle hover:text-emerald-500 transition-colors shrink-0" />
                        <span v-else class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 shrink-0"></span>
                        
                        <template v-if="editingId === cCat.id">
                          <input v-model="editingName" type="text" class="flex-1 w-full px-2 py-1 text-xs rounded border border-emerald-500 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none" @keyup.enter="saveEdit(cCat)" @keyup.esc="cancelEdit" autofocus>
                          <button @click="saveEdit(cCat)" class="text-emerald-600 hover:text-emerald-700 p-1 shrink-0"><Check class="w-3.5 h-3.5" /></button>
                          <button @click="cancelEdit" class="text-slate-400 hover:text-slate-600 p-1 shrink-0"><X class="w-3.5 h-3.5" /></button>
                        </template>
                        <span v-else class="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
                          {{ cCat.name }}
                        </span>
                      </div>
                      
                      <div class="flex items-center gap-1 shrink-0 ml-2" v-if="authState.user?.role === 'ADMIN' && editingId !== cCat.id">
                        <button @click="startEdit(cCat)" class="text-slate-400 hover:text-emerald-600 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Edit2 class="w-3.5 h-3.5" />
                        </button>
                        <button @click="deleteCategory(cCat.id)" class="text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 class="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </template>
                </draggable>
              </div>
            </template>
          </draggable>
        </div>
      </div>
    </div>
  </div>
</template>
