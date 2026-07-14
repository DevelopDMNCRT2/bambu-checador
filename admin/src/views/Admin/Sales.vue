<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
      <!-- Header: Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Ventas</h2>
            
            <!-- Filters & Controls -->
            <div class="flex flex-wrap items-center gap-3">
                <!-- View Mode Selector -->
                <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                   <select 
                      v-model="viewMode" 
                      class="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-0 cursor-pointer py-1 pl-2 pr-8"
                   >
                      <option v-for="opt in viewOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                   </select>
                </div>

                <!-- Filter Tabs -->
                <div class="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                    <button 
                        v-for="filter in filters" 
                        :key="filter.value"
                        @click="setFilter(filter.value)"
                        :class="[
                            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                            activeFilter === filter.value 
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        ]"
                    >
                        {{ filter.label }}
                    </button>
                </div>
                
                <!-- Date Picker (Day Filter) -->
                <input 
                    v-if="activeFilter === 'day'"
                    type="date" 
                    v-model="selectedDate"
                    @change="fetchSales"
                    class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />

                <!-- Range Picker (Range Filter) -->
                <div v-if="activeFilter === 'range'" class="flex items-center gap-2">
                    <input 
                        type="date" 
                        v-model="rangeStart"
                        @change="fetchSales"
                        class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                    <span class="text-gray-400">-</span>
                     <input 
                        type="date" 
                        v-model="rangeEnd"
                        @change="fetchSales"
                        class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                    />
                </div>
            </div>
        </div>

        <!-- Search Bar (Right Aligned) -->
        <div class="relative w-full sm:w-auto">
             <input 
                 v-model="searchTerm" 
                 type="text" 
                 :placeholder="viewMode === 'clients' ? 'Buscar venta...' : 'Buscar producto...'"
                 class="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
             >
             <SearchIcon class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          
          <!-- CLIENT VIEW TABLE -->
          <table v-if="viewMode === 'clients'" class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400"># Orden</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Cliente</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Hora</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Cajero</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Forma de Pago</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Descuento</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
               <tr v-if="loading">
                  <td colspan="9" class="px-5 py-8 text-center text-gray-500 text-sm">Cargando ventas...</td>
               </tr>
               <tr v-else-if="clientTableData.length === 0">
                  <td colspan="9" class="px-5 py-8 text-center text-gray-500 text-sm">No se encontraron ventas para esta fecha.</td>
               </tr>
               <tr v-for="(order, index) in clientTableData" :key="order.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                 
                 <!-- Order ID -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <p class="text-gray-800 text-theme-sm dark:text-white/90 font-medium">#{{ order.id }}</p>
                 </td>

                 <!-- Client Name -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <div class="flex flex-col">
                        <p class="text-gray-800 text-theme-sm dark:text-white/90 font-medium">{{ order.customerName || 'Cliente Casual' }}</p>
                        <p class="text-xs text-gray-400">{{ order.location || 'Barra' }}</p>
                   </div>
                 </td>

                 <!-- Date -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ new Date(order.created_at).toLocaleDateString() }}</p>
                 </td>

                 <!-- Time - Using formatted_time from backend -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ order.time }}</p>
                 </td>

                 <!-- Cashier -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <div class="flex items-center gap-2">
                       <div class="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600">
                           {{ (order.user_name || 'S').charAt(0).toUpperCase() }}
                       </div>
                       <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ order.user_name || 'Sistema' }}</p>
                   </div>
                 </td>

                 <!-- Payment Method -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                    <span 
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="{
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': order.paymentMethod === 'Efectivo',
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': order.paymentMethod === 'Tarjeta',
                            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400': order.paymentMethod === 'Transferencia',
                            'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400': order.paymentMethod === 'CXC',
                             'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300': !['Efectivo', 'Tarjeta', 'Transferencia', 'CXC'].includes(order.paymentMethod)
                        }"
                    >
                        {{ order.paymentMethod }}
                    </span>
                 </td>

                 <!-- Discount -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <p class="text-red-500 font-medium text-theme-sm" v-if="order.discount > 0">
                       -${{ parseFloat(order.discount).toFixed(2) }}
                   </p>
                   <p class="text-gray-400 text-theme-sm" v-else>-</p>
                 </td>

                 <!-- Total -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap">
                   <div v-if="order.paymentMethod === 'CXC' && order.cxc_status === 'active'" class="flex flex-col">
                       <p class="text-gray-500 font-bold text-theme-sm dark:text-gray-400 line-through decoration-brand-500/50">
                           ${{ Math.ceil(parseFloat(order.original_total || order.total)).toFixed(2) }}
                       </p>
                       <span class="text-[10px] font-medium text-brand-600 bg-brand-50 dark:bg-brand-900/30 dark:text-brand-400 px-1.5 py-0.5 rounded-sm inline-block w-max mt-0.5">Pendiente</span>
                   </div>
                   <p v-else class="text-brand-600 font-bold text-theme-sm dark:text-brand-400">
                       ${{ Math.ceil(parseFloat(order.total)).toFixed(2) }}
                   </p>
                 </td>

                 <!-- Actions -->
                 <td class="px-5 py-4 sm:px-6 whitespace-nowrap text-right text-theme-sm font-medium">
                  <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors" title="Ver Detalles" @click="openModal(order)">
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- PRODUCT VIEW TABLE -->
          <table v-else class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Producto</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Pedidos</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Costo total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Utilidad</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ultima fecha</p>
                </th>
              </tr>
            </thead>
             <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
               <tr v-if="loading">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">Calculando ventas...</td>
               </tr>
              <tr v-else-if="productStats.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">No hay productos vendidos en este periodo</td>
              </tr>
              <tr v-for="product in productStats" :key="product.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ product.name }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400 font-medium">
                       {{ product.count }}
                   </p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-brand-600 font-bold text-theme-sm dark:text-brand-400">${{ product.totalSales.toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">${{ (product.count * product.unitCost).toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="font-bold text-theme-sm" :class="(product.totalSales - (product.count * product.unitCost)) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                       ${{ (product.totalSales - (product.count * product.unitCost)).toFixed(2) }}
                   </p>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ formatDate(product.lastDate) }}</p>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>

       <!-- Modal -->
      <OrderDetailsModal 
        v-if="selectedOrder" 
        :is-open="!!selectedOrder" 
        :order="selectedOrder" 
        action-label="Cerrar"
        @close="selectedOrder = null"
        @action="selectedOrder = null"
      />
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import OrderDetailsModal from '@/components/orders/OrderDetailsModal.vue';
import { SearchIcon } from 'lucide-vue-next';
import { authFetch } from '@/utils/api';

const filters = [
    { label: 'Hoy', value: 'today' },
    { label: 'Día', value: 'day' },
    { label: 'Rango', value: 'range' },
];

const viewOptions = [
    { label: 'Por Clientes', value: 'clients' },
    { label: 'Por Productos', value: 'products' },
];

const activeFilter = ref('today');
const viewMode = ref('clients');

// Helper for local YYYY-MM-DD
const getTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const selectedDate = ref(getTodayISO());
const rangeStart = ref(getTodayISO());
const rangeEnd = ref(getTodayISO());
const searchTerm = ref('');

const orders = ref<any[]>([]);
const menuItems = ref<any[]>([]);

const filteredOrders = computed(() => {
    // If in product mode, we might want to filter orders first by date, 
    // BUT the search term might apply to Products, not Orders?
    // User: "si selecciono por productos me va a mostrar una tabla... el rango de fecha establecido en el filtro"
    // User didn't explicitly say search term applies to products, but "El buscador...".
    // Usually search applies to what you see.
    // If viewMode is products, filtering by order ID/Client doesn't make sense visually.
    // But let's first get the DATE-filtered orders.
    return orders.value;
});

const productStats = computed(() => {
    // 1. Filter orders by search term if in Client mode, 
    //    BUT here we are computing Product Stats.
    //    We should use ALL orders in the DATE range, then aggregate, then filter the RESULT by search term (Product Name).
    
    // items mapping
    const stats: Record<string, any> = {};
    const costMap = new Map();
    menuItems.value.forEach(m => {
        costMap.set(m.id, Number(m.real_cost || 0));
    });

    orders.value.forEach(order => {
        if (!order.items) return;
        order.items.forEach((item: any) => {
             // Validate item
             if (!item.menuItemId) return;
             
             if (!stats[item.menuItemId]) {
                 stats[item.menuItemId] = {
                     id: item.menuItemId,
                     name: item.name,
                     count: 0,
                     totalSales: 0,
                     unitCost: costMap.get(item.menuItemId) || 0,
                     lastDate: order.created_at || order.date // Use raw date for sorting
                 };
             }

             stats[item.menuItemId].count += Number(item.quantity);
             stats[item.menuItemId].totalSales += (Number(item.price) * Number(item.quantity));
             
             // Update last date if current order is newer
             if (new Date(order.created_at) > new Date(stats[item.menuItemId].lastDate)) {
                 stats[item.menuItemId].lastDate = order.created_at;
             }
        });
    });

    let result = Object.values(stats);

    // Filter by search term if in product mode
    if (viewMode.value === 'products' && searchTerm.value.trim()) {
        const lower = searchTerm.value.toLowerCase();
        result = result.filter(p => p.name.toLowerCase().includes(lower));
    }

    return result.sort((a, b) => b.totalSales - a.totalSales); // Sort by highest sales default
});

// Computed for the Client Table (Filtered by Search)
const clientTableData = computed(() => {
    if (!searchTerm.value) return orders.value;
    const lower = searchTerm.value.toLowerCase();
    return orders.value.filter(o => 
        o.id.toString().includes(lower) || 
        (o.customerName && o.customerName.toLowerCase().includes(lower)) ||
        (o.user_name && o.user_name.toLowerCase().includes(lower))
    );
});

const loading = ref(false);
const selectedOrder = ref(null);

const setFilter = (val: string) => {
    activeFilter.value = val;
    fetchSales();
};

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

const fetchSales = async () => {
  loading.value = true;
  orders.value = [];
  try {
    const params = new URLSearchParams();
    params.append('status', 'completed');

    if (activeFilter.value === 'today') {
        const today = new Date().toLocaleDateString('en-CA');
        params.append('startDate', today + ' 00:00:00');
        params.append('endDate', today + ' 23:59:59');
    } else if (activeFilter.value === 'day') {
        params.append('startDate', selectedDate.value + ' 00:00:00');
        params.append('endDate', selectedDate.value + ' 23:59:59');
    } else if (activeFilter.value === 'range') {
        params.append('startDate', rangeStart.value + ' 00:00:00');
        params.append('endDate', rangeEnd.value + ' 23:59:59');
    }

    const response = await authFetch(`/api/orders?${params.toString()}`);

    if (response.ok) {
      orders.value = await response.json();
    }
  } catch (error) {
    console.error('Error fetching sales:', error);
  } finally {
      loading.value = false;
  }
};

const fetchMenuItems = async () => {
    try {
        const res = await authFetch('/api/menu-items');
        if (res.ok) {
            menuItems.value = await res.json();
        }
    } catch (e) {
        console.error("Error fetching menu items for cost:", e);
    }
};

const openModal = (order: any) => {
    selectedOrder.value = order;
};

onMounted(() => {
  fetchSales();
  fetchMenuItems();
});
</script>
