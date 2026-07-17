<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
      <!-- Header: Title & Actions -->
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Compras y Gastos</h2>
        </div>
        
        <div class="flex flex-wrap items-center gap-3">
          <!-- View Toggle -->
          <div class="bg-slate-100 dark:bg-gray-800 p-1 rounded-xl inline-flex items-center border border-gray-200 dark:border-gray-700">
             <button 
              @click="viewMode = 'tickets'" 
              :class="viewMode === 'tickets' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none flex items-center gap-2"
            >
              Tickets
            </button>
            <button 
              @click="viewMode = 'accumulated'" 
              :class="viewMode === 'accumulated' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none flex items-center gap-2"
            >
              Acumulado
            </button>
          </div>

          <!-- Search (only for tickets) -->
          <div v-if="viewMode === 'tickets'" class="relative w-full sm:w-64">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar factura..." 
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white"
            />
            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Filter Tabs -->
          <div class="bg-slate-100 dark:bg-gray-800 p-1 rounded-xl inline-flex items-center">
            <button 
              @click="activeFilter = 'today'" 
              :class="activeFilter === 'today' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Hoy
            </button>
            <button 
              v-if="viewMode === 'tickets'"
              @click="activeFilter = 'no_breakdown'" 
              :class="activeFilter === 'no_breakdown' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Sin Desglose
            </button>
            <button 
              @click="activeFilter = 'day'" 
              :class="activeFilter === 'day' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Día
            </button>
             <button 
              @click="activeFilter = 'month'" 
              :class="activeFilter === 'month' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Mes
            </button>
          </div>

          <!-- Date/Month Picker -->
          <div class="relative w-40">
            <input
              v-if="activeFilter === 'day'"
              type="date"
              v-model="selectedDate"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white cursor-pointer text-center shadow-sm"
            />
            <input
              v-else-if="activeFilter === 'month'"
              type="month"
              v-model="selectedMonth"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white cursor-pointer text-center shadow-sm"
            />
            <input
               v-else
              type="text"
              disabled
              placeholder="-"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-semibold focus:outline-none text-gray-400 dark:text-gray-500 cursor-not-allowed text-center shadow-sm"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 ml-auto xl:ml-0">
            <Button size="md" variant="outline" :startIcon="UploadIcon" @click="isXMLModalOpen = true" class="rounded-full flex items-center gap-1.5">
               XML
            </Button>
            <Button size="md" variant="primary" @click="handleAddNew" class="rounded-full">
               Nuevo Ticket
            </Button>
          </div>
        </div>
      </div>

      <!-- Tickets Table Container -->
      <div v-if="viewMode === 'tickets'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ticket</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Proveedor</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha de Compra</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Forma de Pago</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Estado</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="filteredPurchases.length === 0">
                <td colspan="7" class="px-5 py-8 text-center text-gray-500 text-sm">No hay compras registradas en este periodo</td>
              </tr>
              <tr v-for="(purchase, index) in filteredPurchases" :key="index" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-5 py-4 sm:px-6">
                  <span class="text-gray-500 text-theme-sm dark:text-gray-400">#{{ purchase.ticketNumber }}</span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ purchase.provider }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ purchase.date }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="font-semibold text-gray-700 text-theme-sm dark:text-gray-200">${{ purchase.total }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ purchase.paymentMethod }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                    <span
                    :class="[
                      'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                      {
                        'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                          purchase.status === 'Desglosado',
                        'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400':
                          purchase.status === 'Sin Desglose',
                      },
                    ]"
                  >
                    {{ purchase.status }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-success-600 dark:text-gray-400 dark:hover:text-success-400" title="Desglosar" @click="handleBreakdown(purchase.id)">
                      <DollarIcon class="w-5 h-5" />
                    </button>
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="handleEdit(purchase.id)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Borrar" @click="handleDelete(purchase.id)">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

       <!-- Accumulated Table Container -->
      <div v-if="viewMode === 'accumulated'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Producto (Insumo)</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Cantidad Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Precio Promedio</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Costo Invertido</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="accumulatedItems.length === 0">
                <td colspan="4" class="px-5 py-12 text-center text-gray-500 text-sm">
                   <div class="flex flex-col items-center justify-center">
                        <DollarIcon class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        No hay insumos acumulados en este periodo
                   </div>
                </td>
              </tr>
              <tr v-for="(item, index) in accumulatedItems" :key="index" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ item.product_name }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-600 font-medium text-theme-sm dark:text-gray-300">
                      {{ Number(item.total_quantity).toFixed(2) }} <span class="text-gray-400 text-xs">{{ item.unit }}</span>
                    </p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-600 text-theme-sm dark:text-gray-300">${{ Number(item.avg_price).toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="font-bold text-brand-600 text-theme-sm dark:text-brand-400">${{ Number(item.total_spent).toFixed(2) }}</p>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="accumulatedItems.length > 0">
                <tr class="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                    <td colspan="3" class="px-5 py-4 sm:px-6 text-right font-semibold text-gray-700 dark:text-gray-200 text-sm">
                        Total Invertido en el periodo:
                    </td>
                    <td class="px-5 py-4 sm:px-6 font-bold text-brand-600 dark:text-brand-400 text-lg">
                        ${{ accumulatedTotal.toFixed(2) }}
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
    
    <ImportXMLModal 
      v-if="isXMLModalOpen" 
      @cancel="isXMLModalOpen = false" 
      @imported="handleXMLImported" 
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from 'vue-router';
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { authFetch } from '@/utils/api';
import Button from "@/components/ui/Button.vue";
import { PencilIcon, TrashIcon, DollarIcon, UploadIcon } from "@/icons";
import ImportXMLModal from "./ImportXMLModal.vue";

const router = useRouter();
const isXMLModalOpen = ref(false);
const searchQuery = ref('');

// State
const viewMode = ref<'tickets' | 'accumulated'>('tickets');
const activeFilter = ref('today');
const selectedDate = ref(new Date().toLocaleDateString('en-CA'));
const selectedMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM

const purchases = ref<any[]>([]);
const accumulatedItems = ref<any[]>([]);

// Fetch Accumulated Data
const fetchAccumulated = async () => {
    let startDate = '';
    let endDate = '';

    if (activeFilter.value === 'today') {
        const today = getTodayString();
        startDate = today;
        endDate = today;
    } else if (activeFilter.value === 'day') {
        startDate = selectedDate.value;
        endDate = selectedDate.value;
    } else if (activeFilter.value === 'month' && selectedMonth.value) {
        const [year, month] = selectedMonth.value.split('-');
        const firstDay = new Date(Number(year), Number(month) - 1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);
        
        // Ensure month format preserves zeros using toLocaleDateString might be risky based on locale, manual formatting is safer
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        startDate = `${yearStart}-${monthStart}-01`;
        
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        endDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
    } else {
        // If "no_breakdown" or something else, default to this month to prevent huge queries
        const [year, month] = selectedMonth.value.split('-');
        const firstDay = new Date(Number(year), Number(month) - 1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);
        
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        startDate = `${yearStart}-${monthStart}-01`;
        
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        endDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
    }

    try {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        const response = await authFetch(`/api/purchases/accumulated?${params}`);
        if (response.ok) {
            const data = await response.json();
            accumulatedItems.value = data;
        }
    } catch (error) {
        console.error('Error fetching accumulated purchases:', error);
    }
};

const accumulatedTotal = computed(() => {
    return accumulatedItems.value.reduce((sum, item) => sum + Number(item.total_spent || 0), 0);
});

// Fetch Tickets Data
const fetchPurchases = async () => {
  try {
    const response = await authFetch('/api/purchases');
    if (response.ok) {
      const data = await response.json();
      purchases.value = data;
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
  }
};

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const handleXMLImported = () => {
  isXMLModalOpen.value = false;
  fetchData();
};

const fetchData = () => {
    if (viewMode.value === 'tickets') {
        fetchPurchases();
    } else {
        fetchAccumulated();
    }
};

// Watchers to trigger refetch
watch(viewMode, () => {
    fetchData();
});

watch([activeFilter, selectedDate, selectedMonth], () => {
    if (viewMode.value === 'accumulated') {
        fetchAccumulated();
    }
});

const filteredPurchases = computed(() => {
    return purchases.value.filter(p => {
        const matchesSearch = !searchQuery.value || 
            (p.ticketNumber && p.ticketNumber.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
            (p.provider && p.provider.toLowerCase().includes(searchQuery.value.toLowerCase()));
            
        let matchesDate = true;
        if (activeFilter.value === 'today') {
            const today = getTodayString();
            matchesDate = p.date === today;
        } else if (activeFilter.value === 'no_breakdown') {
            matchesDate = p.status === 'Sin Desglose';
        } else if (activeFilter.value === 'day') {
            matchesDate = !selectedDate.value || p.date === selectedDate.value;
        } else if (activeFilter.value === 'month') {
            matchesDate = !selectedMonth.value || p.date.startsWith(selectedMonth.value);
        }
        
        return matchesSearch && matchesDate;
    });
});

const handleDelete = async (id: number) => {
    if(!confirm('¿Estás seguro de eliminar esta compra?')) return;
    try {
        const response = await authFetch(`/api/purchases/${id}`, {
            method: 'DELETE'
        });
        if(response.ok) {
            fetchPurchases();
        } else {
            alert('Error al eliminar ticket');
        }
    } catch (error) {
        console.error('Error deleting purchase:', error);
    }
};

onMounted(() => {
  fetchData();
});

const handleEdit = (id: number) => {
   router.push(`/purchases/${id}/edit`);
};

const handleBreakdown = (id: number) => {
    router.push(`/purchases/${id}/breakdown`);
};

const handleAddNew = () => {
   router.push('/purchases/create');
};
</script>
