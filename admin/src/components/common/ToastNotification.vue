<template>
  <Transition name="toast">
    <div 
        v-if="visible && notification" 
        @click="goToOrders"
        class="fixed bottom-6 right-6 z-[9999] w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 border-brand-500 overflow-hidden flex items-start p-4 gap-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
    >
        <!-- Icon -->
        <div class="flex-shrink-0 bg-brand-50 dark:bg-brand-900/20 p-2 rounded-full text-brand-600 dark:text-brand-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
        </div>

        <!-- Content -->
        <div class="flex-1">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white capitalize">
                {{ notification.title || 'Nueva Notificación' }}
            </h4>
            <p class="mt-1 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {{ notification.message }}
            </p>
            <p class="mt-2 text-xs text-gray-400">{{ notification.time }}</p>
        </div>

        <!-- Close -->
        <button @click.stop="close" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { notifications } = useNotifications()
const visible = ref(false)
const notification = ref<any>(null)
let timer: any = null

// Watch for new notifications being added to the front of the list
watch(() => notifications.value.length, (newLen, oldLen) => {
    if (newLen > oldLen && newLen > 0) {
        // New item added at index 0
        showToast(notifications.value[0])
    }
})

const showToast = (item: any) => {
    notification.value = item
    visible.value = true
    
    // Auto hide
    clearTimeout(timer)
    timer = setTimeout(() => {
        visible.value = false
    }, 6000) // 6 seconds
}

const close = () => {
    visible.value = false
    clearTimeout(timer)
}

const goToOrders = () => {
    close()
    router.push('/orders')
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}
</style>
