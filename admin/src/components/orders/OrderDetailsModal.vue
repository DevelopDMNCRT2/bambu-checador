<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6" role="dialog" aria-modal="true" v-if="isOpen">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

      <!-- Modal Panel -->
      <div class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col transform transition-all animate-fade-in-up">
        
        <!-- Header -->
        <div class="px-6 py-4 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
           <div class="flex flex-col items-start gap-1">
              <h2 class="text-2xl font-medium text-gray-900 dark:text-white">Orden #{{ order.id }}</h2>
           </div>
           
           <div class="flex items-center gap-4">
              <div class="flex items-center gap-1 text-red-500 font-medium text-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                 </svg>
                 {{ order.deliveryTime || order.time }}
              </div>
              <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
              </button>
           </div>
        </div>

        <div class="p-6 space-y-6">
            <!-- Client Section -->
            <section>
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cliente</h3>
                <div class="space-y-2">
                    <div class="flex items-center gap-2 text-gray-700 dark:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span class="font-medium text-sm">{{ order.customerName }}</span>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-700 dark:text-gray-200">
                        <div v-if="order.customerPhone" class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                               <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                            </svg>
                            <span class="font-medium text-sm">{{ order.customerPhone }}</span>
                        </div>
                        <div v-if="order.location" class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                <circle cx="12" cy="10" r="3"></circle>
                            </svg>
                            <span class="font-medium text-sm">{{ order.location }}</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Products Section -->
            <section>
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Productos</h3>
                <div class="space-y-4">
                    <div v-for="item in order.items" :key="item.id">
                        <div class="flex justify-between items-start mb-1">
                            <div class="font-medium text-gray-900 dark:text-white text-base">
                                <span class="font-bold mr-1">{{ item.quantity.toFixed(2) }}x</span>
                                {{ item.name }}
                            </div>
                            <div class="text-gray-600 dark:text-gray-300 font-medium">
                                ${{ item.price.toFixed(2) }}
                            </div>
                        </div>
                        
                        <!-- Variations -->
                        <div v-if="item.variations && item.variations.length" class="text-sm text-gray-500 mb-2 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
                             <div v-for="variant in item.variations" :key="variant">
                                - {{ variant }}
                             </div>
                        </div>

                         <!-- Item Note -->
                         <div v-if="item.note" class="mt-2 bg-orange-50 border border-orange-100 rounded-lg p-3 flex items-start gap-2 text-orange-800 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <span>{{ item.note }}</span>
                         </div>
                         
                         <div class="border-b border-gray-100 dark:border-gray-700 border-dashed my-3 last:hidden"></div>
                    </div>
                </div>
            </section>

             <!-- General Notes Section -->
            <section v-if="order.generalNote">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Notas</h3>
                 <div class="bg-amber-50 border border-amber-100 border-l-4 border-l-amber-400 rounded-r-lg p-4 text-amber-900 text-sm font-medium">
                     {{ order.generalNote }}
                 </div>
            </section>

             <!-- Payment Section -->
             <section>
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Pago</h3>
                <div class="flex justify-between items-center text-base">
                    <div class="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <component :is="paymentIcon" class="w-5 h-5 text-gray-500" stroke-width="2" />
                        <span class="capitalize">{{ order.paymentMethod }}</span>
                    </div>
                     <span class="text-xl font-bold text-gray-900 dark:text-white">${{ order.total.toFixed(2) }}</span>
                </div>
             </section>
        </div>

        <!-- Footer -->
        <div class="p-6 pt-0 mt-auto grid grid-cols-2 gap-3 sticky bottom-0 bg-white dark:bg-gray-800 z-10">
            <button 
                @click="$emit('close')"
                class="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
                Cerrar
            </button>
            <button 
                @click="$emit('action')"
                class="px-4 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
            >
                {{ actionLabel }}
            </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  order: {
    type: Object,
    required: true
  },
  actionLabel: {
    type: String,
    default: 'Avanzar'
  }
});

defineEmits(['close', 'action']);

const statusLabel = computed(() => {
    switch(props.order.status) {
        case 'new': return 'Nuevo';
        case 'preparing': return 'En preparación';
        case 'delivering': return 'En entrega';
        case 'completed': return 'Completado';
        default: return props.order.status;
    }
});

import { 
    Banknote, 
    CreditCard, 
    Smartphone, 
    Truck, 
    FileText, 
    Gift 
} from 'lucide-vue-next';

const paymentIcon = computed(() => {
    if (!props.order.paymentMethod) return CreditCard;
    
    const method = props.order.paymentMethod.toLowerCase();
    
    if (method.includes('efectivo')) return Banknote;
    if (method.includes('tarjeta')) return CreditCard;
    if (method.includes('transferencia')) return Smartphone;
    if (method.includes('uber')) return Truck;
    if (method.includes('cxc')) return FileText;
    if (method.includes('cortesía') || method.includes('cortesia')) return Gift;
    
    return CreditCard; // Default
});
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.96);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
