<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      <!-- Header & Search -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">CXC</h2>
        </div>
      
        <!-- Search and Actions -->
        <div class="flex flex-col sm:flex-row gap-3 sm:items-center">
             <div class="relative">
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    class="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
                >
                <SearchIcon class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             </div>

             <Button 
                v-if="canLiquidateAll"
                @click="liquidateAll"
                variant="primary"
                size="md"
                class="rounded-full flex items-center gap-2"
             >
                <ShoppingCartIcon class="w-4 h-4" />
                <span>Liquidar Todo ({{ filteredList.length }})</span>
             </Button>
        </div>
      </div>

      <!-- Table Section -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Cliente</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Teléfono</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400"># Orden</p>
                </th>
                <th class="px-5 py-3 text-right sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Monto Pendiente</p>
                </th>
                 <th class="px-5 py-3 text-center sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">Cargando cuentas...</td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">
                    {{ searchQuery ? 'No se encontraron resultados.' : 'No hay cuentas por cobrar pendientes.' }}
                </td>
              </tr>
              <tr v-for="item in filteredList" :key="item.id" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ item.customer_name }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.customer_phone || '-' }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.formatted_date }}</p>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-brand-600 font-mono text-theme-sm">#{{ item.order_id }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6 text-right">
                   <p class="font-bold text-error-500 text-theme-sm">${{ Number(item.amount).toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6 text-center">
                    <button 
                        @click="liquidateDebt([item])"
                        class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:scale-95 transition-all shadow-sm"
                    >
                        <ShoppingCartIcon class="w-3.5 h-3.5" />
                        <span>Liquidar</span>
                    </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Button from '@/components/ui/Button.vue';
import { ShoppingCartIcon, SearchIcon } from 'lucide-vue-next';
import { authFetch } from '@/utils/api';

const router = useRouter();
const cxcList = ref([]);
const loading = ref(true);
const searchQuery = ref("");

const fetchCXC = async () => {
    loading.value = true;
    try {
        const res = await authFetch('/api/cxc');
        if (res.ok) {
            cxcList.value = await res.json();
        }
    } catch (e) {
        console.error("Error fetching CXC:", e);
    } finally {
        loading.value = false;
    }
};

const filteredList = computed(() => {
    if (!searchQuery.value) return cxcList.value;
    const lower = searchQuery.value.toLowerCase();
    return cxcList.value.filter(item => 
        item.customer_name.toLowerCase().includes(lower) || 
        (item.customer_phone && item.customer_phone.includes(lower))
    );
});

// Logic to determine if "Liquidate All" should be shown
// Shown if we have results, and they basically belong to "one entity" contextually? 
// Or just allow user to liquidate ANY filtered selection?
// The user request: "Una vez que busque Ricardo... liquidar todas las cuentas bajo ese nombre".
// So we should check if all filtered items belong to the same customer name?
const canLiquidateAll = computed(() => {
    if (filteredList.value.length < 2) return false; // Need at least 2 to justify "All"
    
    // Check if they are all same customer?
    // User might filter "Juan" and get "Juan Perez" and "Juan Lopez". Liquidating both might be weird.
    // It's safer to show "Liquidar Todo" only if the search query is specific enough 
    // OR we just Liquidate the Viewed list.
    // User asked "liquidar todas las cuentas bajo ese nombre juntas".
    // I will enable it always for the filtered list, but maybe prompt confirmation with names.
    return true; 
});

const liquidateAll = () => {
    liquidateDebt(filteredList.value);
};

const liquidateDebt = async (items) => {
    const isBulk = items.length > 1;
    const ids = items.map(i => `#${i.order_id}`).join(', ');
    const names = [...new Set(items.map(i => i.customer_name))].join(', ');
    
    const msg = isBulk 
        ? `¿Cargar ${items.length} órdenes (${ids}) de ${names} al carrito para liquidación total?`
        : `¿Cargar orden #${items[0].order_id} al carrito para liquidar deuda de ${items[0].customer_name}?`;

    if (!confirm(msg)) return;

    try {
        // We need to fetch items for ALL these orders.
        // We will fetch all details in parallel.
        const orderIds = items.map(i => i.order_id);
        
        // Fetch all order details
        const orderPromises = orderIds.map(id => authFetch(`/api/orders?id=${id}`).then(r => r.json()));
        const results = await Promise.all(orderPromises);
        
        // Flatten: specific order fetch returns array [0]
        const orders = results.map(r => r[0]).filter(Boolean);
        
        if (orders.length > 0) {
             // Pass Array of orders if bulk, or single object if single?
             // To support existing flow, let's wrap in an object expected by POS but with a special flag?
             // Or better: Pass the Array directly and update `POS.vue` to handle it.
             
             // We'll store a special key 'pending_pos_load_bulk' which is an Array.
             localStorage.setItem('pending_pos_load_bulk', JSON.stringify(orders));
             localStorage.removeItem('pending_pos_load'); // Clear single
             
             router.push('/pos');
        } else {
            alert('No se pudieron cargar los detalles.');
        }

    } catch(e) {
        console.error(e);
        alert('Error al cargar órdenes');
    }
};

onMounted(() => {
    fetchCXC();
});
</script>
