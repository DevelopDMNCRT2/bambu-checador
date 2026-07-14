<template>
  <AdminLayout>
    
    <div class="space-y-5 sm:space-y-6">
      <!-- Header & Search -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div class="flex flex-col sm:flex-row sm:items-center gap-4">
             <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Clientes</h2>
             
             <!-- Filters -->
             <div class="flex items-center gap-3">
                <div class="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                   <button 
                     @click="setFilter('all')"
                     :class="[
                       'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                       currentFilter === 'all' 
                           ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                           : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                     ]"
                   >
                     Todos
                   </button>
                    <button 
                     @click="setFilter('debt')"
                     :class="[
                       'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                       currentFilter === 'debt' 
                           ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                           : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                     ]"
                   >
                     Cuentas Abiertas
                   </button>
                </div>
              </div>
        </div>
        
        <div class="relative w-full sm:w-auto min-w-[300px]">
             <input 
                v-model="searchQuery"
                @input="handleSearch"
                type="text" 
                placeholder="Buscar por nombre o teléfono..." 
                class="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 w-full"
             />
             <SearchIcon class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Nombre</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Teléfono</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Cuenta</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Pedidos</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Platillo Favorito</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-sm dark:text-gray-400">Último Pedido</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading">
                  <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">Cargando...</td>
              </tr>
              <tr v-else-if="clients.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">No se encontraron clientes</td>
              </tr>
              <tr v-for="(client, index) in clients" :key="client.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                      <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {{ client.name }}
                      </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ client.phone || '-' }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                     <span
                        :class="[
                          'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                          Number(client.balance) > 0
                            ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500' 
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' 
                        ]"
                      >
                        {{ Number(client.balance) > 0 ? 'Abierta' : 'Cerrada' }}
                      </span>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400 font-medium">{{ client.total_orders }}</p>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400 truncate max-w-[150px]" :title="client.favorite_dish">
                        {{ client.favorite_dish || '-' }}
                   </p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                        {{ formatDate(client.last_order_date) }}
                   </p>
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
import { ref, onMounted, watch } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { SearchIcon } from 'lucide-vue-next';
import { debounce } from "lodash"; 

// If lodash isn't available, I'll use a custom debounce, but admin template likely has it?
// To be safe, I will implement a custom simple debounce inside.

import { authFetch } from '@/utils/api';

// ...

const clients = ref([]);
const loading = ref(false);
const searchQuery = ref("");
const currentFilter = ref("all");

const fetchClients = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (searchQuery.value) params.append('q', searchQuery.value);
    if (currentFilter.value !== 'all') params.append('filter', currentFilter.value);

    const response = await authFetch(`/api/customers?${params.toString()}`);
    if (response.ok) {
        clients.value = await response.json();
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
  } finally {
    loading.value = false;
  }
};

let debounceTimer = null;
const handleSearch = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        fetchClients();
    }, 400);
};

const setFilter = (filter) => {
    currentFilter.value = filter;
    fetchClients();
};

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);
};

const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // dateStr comes as ISO usually from PG
    return new Date(dateStr).toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

onMounted(() => {
  fetchClients();
});
</script>
