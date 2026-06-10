<script setup lang="ts">
import { useToast } from '../composables/useToast'
import { CheckCircle, XCircle, Info, X } from 'lucide-vue-next'

const { toasts, remove } = useToast()
</script>

<template>
  <div class="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
    <TransitionGroup name="toast">
      <div 
        v-for="toast in toasts" 
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 px-4 py-3 min-w-[300px] max-w-sm rounded-xl shadow-lg border backdrop-blur-sm transition-all duration-300"
        :class="{
          'bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200': toast.type === 'success',
          'bg-red-50/90 dark:bg-red-950/90 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200': toast.type === 'error',
          'bg-blue-50/90 dark:bg-blue-950/90 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200': toast.type === 'info'
        }"
      >
        <div class="shrink-0 mt-0.5">
          <CheckCircle v-if="toast.type === 'success'" class="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
          <XCircle v-else-if="toast.type === 'error'" class="w-5 h-5 text-red-500 dark:text-red-400" />
          <Info v-else class="w-5 h-5 text-blue-500 dark:text-blue-400" />
        </div>
        
        <p class="flex-1 text-sm font-semibold leading-snug">{{ toast.message }}</p>
        
        <button @click="remove(toast.id)" class="shrink-0 p-1 -mr-1 -mt-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity">
          <X class="w-4 h-4" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.95);
}
</style>
