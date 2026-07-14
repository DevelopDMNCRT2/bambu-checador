<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
      <!-- Header: Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Compras</h2>
            <!-- Filter Tabs -->
            <div class="flex items-center gap-3">
                <div class="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                    <button 
                        v-for="filter in filters" 
                        :key="filter.value"
                        @click="activeFilter = filter.value"
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
                
                <!-- Date Picker -->
                <input 
                    v-if="activeFilter === 'day'"
                    type="date" 
                    v-model="selectedDate"
                    class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />
            </div>
        </div>

        <Button size="md" variant="primary" @click="handleAddNew" class="rounded-full">
           Nuevo Ticket
        </Button>
      </div>

      <!-- Table Container -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
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
                <td colspan="7" class="px-5 py-8 text-center text-gray-500 text-sm">No hay compras registradas</td>
              </tr>
              <tr v-for="(purchase, index) in filteredPurchases" :key="index" class="border-t border-gray-100 dark:border-gray-800">
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
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">${{ purchase.total }}</p>
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
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from 'vue-router';
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { authFetch } from '@/utils/api';
import Button from "@/components/ui/Button.vue";
import { PencilIcon, TrashIcon, DollarIcon } from "@/icons";

const router = useRouter();

const filters = [
    { label: 'Hoy', value: 'today' },
    { label: 'Sin Desglose', value: 'no_breakdown' },
    { label: 'Día', value: 'day' },
];

const activeFilter = ref('today');
const selectedDate = ref(new Date().toLocaleDateString('en-CA')); // YYYY-MM-DD in user's locale usually, but en-CA is reliable for ISO format local

const purchases = ref<any[]>([]);
const totalPurchases = ref(0);

const calculateTotal = () => {
  totalPurchases.value = filteredPurchases.value.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
};

const fetchPurchases = async () => {
  try {
    const response = await authFetch('/api/purchases');
    if (response.ok) {
      const data = await response.json();
      purchases.value = data;
      calculateTotal();
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
  }
};

const getTodayString = () => {
    // Returns YYYY-MM-DD in local time
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const filteredPurchases = computed(() => {
    if (activeFilter.value === 'today') {
        const today = getTodayString();
        return purchases.value.filter(p => p.date === today);
    }
    if (activeFilter.value === 'no_breakdown') {
        return purchases.value.filter(p => p.status === 'Sin Desglose');
    }
    if (activeFilter.value === 'day') {
        return purchases.value.filter(p => p.date === selectedDate.value);
    }
    return purchases.value;
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
  fetchPurchases();
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
