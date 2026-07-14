<template>
  <AdminLayout>
    <div class="flex flex-col w-full h-[calc(100vh-100px)] md:h-[calc(100vh-140px)]">
      
      <!-- Board Container -->
      <div class="flex-1 min-h-0 w-full">
        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 h-full pb-2 md:pb-0 overflow-y-auto md:overflow-hidden">
          
          <!-- Column: Nuevo -->
          <div class="flex flex-col h-auto md:h-full max-h-full bg-gray-50/50 dark:bg-gray-800/10 rounded-2xl border border-gray-100 dark:border-gray-800 px-2 py-3">
             <!-- Header -->
             <div class="flex-none flex items-center justify-between mb-4 px-2">
                <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
                   <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                   </svg>
                   Nuevo
                </div>
                <span class="bg-white dark:bg-gray-700 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm border border-gray-100 dark:border-gray-600">
                  {{ newOrders.length }}
                </span>
             </div>

             <!-- List -->
             <div class="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-3">
                <OrderCard 
                   v-for="order in newOrders" 
                   :key="order.id"
                   :order="order"
                   actionLabel="Ver pedido"
                   @click="openOrder(order)"
                   @advance="openOrder(order)"
                />
                
                <div v-if="newOrders.length === 0" class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                   <span class="text-sm">Sin órdenes nuevas</span>
                </div>
             </div>
          </div>

          <!-- Column: En preparación -->
          <div class="flex flex-col h-auto md:h-full max-h-full bg-gray-50/50 dark:bg-gray-800/10 rounded-2xl border border-gray-100 dark:border-gray-800 px-2 py-3">
             <div class="flex-none flex items-center justify-between mb-4 px-2">
                <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
                   <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20h9"></path>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                   </svg>
                   En preparación
                </div>
                <span class="bg-white dark:bg-gray-700 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm border border-gray-100 dark:border-gray-600">
                  {{ preparingOrders.length }}
                </span>
             </div>

             <div class="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-3">
                <OrderCard 
                   v-for="order in preparingOrders" 
                   :key="order.id"
                   :order="order"
                   actionLabel="Entregar"
                   @click="openOrder(order)"
                   @advance="moveToDelivering(order)"
                />

                <div v-if="preparingOrders.length === 0" class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                   <span class="text-sm">Sin órdenes en cocina</span>
                </div>
             </div>
          </div>

          <!-- Column: En entrega -->
          <div class="flex flex-col h-auto md:h-full max-h-full bg-gray-50/50 dark:bg-gray-800/10 rounded-2xl border border-gray-100 dark:border-gray-800 px-2 py-3">
             <div class="flex-none flex items-center justify-between mb-4 px-2">
                <div class="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200">
                   <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="1" y="3" width="15" height="13"></rect>
                      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                      <circle cx="5.5" cy="18.5" r="2.5"></circle>
                      <circle cx="18.5" cy="18.5" r="2.5"></circle>
                   </svg>
                   En entrega
                </div>
                <span class="bg-white dark:bg-gray-700 px-2.5 py-0.5 rounded-md text-sm font-bold shadow-sm border border-gray-100 dark:border-gray-600">
                  {{ deliveringOrders.length }}
                </span>
             </div>

             <div class="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col gap-3">
                <OrderCard 
                   v-for="order in deliveringOrders" 
                   :key="order.id"
                   :order="order"
                   actionLabel="Completar"
                   @click="openOrder(order)"
                   @advance="completeOrder(order)"
                />

                 <div v-if="deliveringOrders.length === 0" class="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-gray-400">
                   <span class="text-sm">Sin órdenes para entregar</span>
                </div>
             </div>
          </div>

        </div>
      </div>

      <!-- Modal -->
      <OrderDetailsModal 
        v-if="selectedOrder" 
        :is-open="!!selectedOrder" 
        :order="selectedOrder" 
        :action-label="modalActionLabel"
        @close="selectedOrder = null"
        @action="handleModalAction"
      />

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import OrderCard from '@/components/orders/OrderCard.vue';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal.vue';

// Data
const router = useRouter();
const orders = ref([]);
let pollingInterval;

// Fetch Orders
const fetchOrders = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders`);
    if (res.ok) {
        const data = await res.json();
        // Preserve client-side reactivity if possible, or just replace
        orders.value = data;
    }
  } catch (e) {
    console.error("Error fetching orders:", e);
  }
};

const updateOrderStatus = async (orderId, newStatus) => {
    try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (res.ok) {
            // Optimistic update or refetch
            fetchOrders();
        }
    } catch (e) {
        console.error("Error updating status:", e);
    }
};

const newOrders = computed(() => orders.value.filter(o => o.status === 'new'));
const preparingOrders = computed(() => orders.value.filter(o => o.status === 'preparing'));
const deliveringOrders = computed(() => orders.value.filter(o => o.status === 'delivering'));

const selectedOrder = ref(null);

const modalActionLabel = computed(() => {
    if (!selectedOrder.value) return '';
    switch(selectedOrder.value.status) {
        case 'new': return 'Empezar Orden';
        case 'preparing': return 'Enviar a Entrega';
        case 'delivering': return 'Completar Orden';
        default: return 'Cerrar';
    }
});

const openOrder = (order) => {
    selectedOrder.value = order;
};

const moveToPreparing = (order) => {
    updateOrderStatus(order.id, 'preparing');
};

const moveToDelivering = (order) => {
    updateOrderStatus(order.id, 'delivering');
};

const completeOrder = async (order) => {
     await updateOrderStatus(order.id, 'completed');
     localStorage.setItem('pending_pos_load', JSON.stringify(order));
     selectedOrder.value = null;
     router.push('/pos');
};

const handleModalAction = () => {
    if (!selectedOrder.value) return;
    
    const order = selectedOrder.value;
    if (order.status === 'new') moveToPreparing(order);
    else if (order.status === 'preparing') moveToDelivering(order);
    else if (order.status === 'delivering') completeOrder(order);
    
    // We can keep modal open or close it. 
    // Usually moving to next stage implies working on it, so close might be better.
    selectedOrder.value = null;
};

onMounted(() => {
    fetchOrders(); 
    pollingInterval = setInterval(fetchOrders, 5000); // Poll every 5s
});

onUnmounted(() => {
    if (pollingInterval) clearInterval(pollingInterval);
});

</script>
