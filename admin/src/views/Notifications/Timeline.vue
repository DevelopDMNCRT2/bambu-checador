<template>
  <AdminLayout>
    <div class="mx-auto max-w-2xl min-h-screen">
      <!-- Header -->
      <div class="mb-8 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Notificaciones</h2>
        <div class="flex gap-2">
            <button 
                @click="markAsRead" 
                class="text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
                Marcar todas como leídas
            </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="notifications.length === 0" class="flex flex-col items-center justify-center py-20 text-center">
        <div class="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Sin notificaciones</h3>
        <p class="text-gray-500 dark:text-gray-400 mt-1">No tienes nuevas alertas por el momento.</p>
      </div>

      <!-- Timeline -->
      <div v-else class="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-gray-200 before:via-gray-200 before:to-transparent dark:before:from-gray-700 dark:before:via-gray-700 md:before:mx-auto md:before:translate-x-0">

        <div v-for="(item, index) in notifications" :key="item.id" class="relative flex items-start group">
            
            <!-- Icon / Dot -->
            <div class="absolute left-0 mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-white bg-gray-100 shadow dark:border-gray-900 dark:bg-gray-800 ring-8 ring-white dark:ring-gray-900">
                 <img v-if="item.userImage && !item.userImage.includes('ui-avatars.com')" :src="item.userImage" class="rounded-full w-full h-full object-cover" />
                 <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                 </svg>
            </div>

            <!-- Content Card -->
            <div class="ml-16 w-full rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-800">
                <div class="flex items-center justify-between mb-2">
                    <span class="flex items-center gap-2">
                        <span class="font-bold text-gray-900 dark:text-white capitalize">{{ item.userName }}</span>
                        <!-- Status Badge optional -->
                        <span v-if="!item.read" class="inline-block w-2 h-2 rounded-full bg-red-500" title="No leído"></span>
                    </span>
                    <span class="text-xs text-gray-400 font-medium">{{ item.time }}</span>
                </div>
                
                <p class="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {{ item.message }}
                </p>

                <!-- Action Button (Contextual) -->
                <button 
                    v-if="item.type === 'Order'"
                    @click="$router.push('/orders')"
                    class="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
                >
                    Ver Órdenes
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
                </button>
            </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useNotifications } from '@/composables/useNotifications'

const { notifications, markAsRead } = useNotifications()

onMounted(() => {
    // Optionally mark as read when visiting this page?
    // User asked "View all... show as timeline". 
    // Usually visiting the center does NOT auto-clear, but user might want to manually clear or clear on click.
    // I'll leave the manual button or rely on menu open.
    // Actually, often visiting the full list clears the 'unread' badge. 
    markAsRead()
})
</script>
