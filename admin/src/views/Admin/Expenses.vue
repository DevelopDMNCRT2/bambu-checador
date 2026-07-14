<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
      <!-- Header: Title & Actions -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Gastos</h2>
            
            <!-- Filters & Controls -->
            <div class="flex items-center gap-3">
                <!-- Filter Tabs -->
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
                
                <!-- Date Picker (Day Filter) -->
                <input 
                    v-if="activeFilter === 'day'"
                    type="date" 
                    v-model="selectedDate"
                    class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                />

                <!-- Month Picker (Month Filter) -->
                <select
                    v-if="activeFilter === 'month'"
                    v-model="selectedMonth"
                    class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                >
                    <option v-for="m in availableMonths" :key="m.value" :value="m.value">{{ m.label }}</option>
                </select>
            </div>
        </div>

        <Button size="md" variant="primary" @click="handleAddNew" class="rounded-full">
           Nuevo Gasto
        </Button>
      </div>

      <!-- Table Container -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Concepto</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Monto</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Pagado A</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Forma de Pago</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="filteredExpenses.length === 0">
                <td colspan="7" class="px-5 py-8 text-center text-gray-500 text-sm">No hay gastos para mostrar</td>
              </tr>
              <tr v-for="(expense, index) in filteredExpenses" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ expense.concept }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ expense.date }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">${{ expense.amount }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ expense.paidTo }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ expense.paymentMethod }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="handleEdit(expense.id)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Borrar" @click="handleDelete(expense.id)">
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
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from 'vue-router';
import AdminLayout from "@/components/layout/AdminLayout.vue";
import Button from "@/components/ui/Button.vue";
import { PencilIcon, TrashIcon } from "@/icons";

import { authFetch } from '@/utils/api';

const router = useRouter();

const filters = [
    { label: 'Hoy', value: 'today' },
    { label: 'Día', value: 'day' },
    { label: 'Mes', value: 'month' },
];

const activeFilter = ref('today');
const selectedDate = ref(new Date().toLocaleDateString('en-CA'));
const selectedMonth = ref('');

const expenses = ref<any[]>([]);

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const fetchExpenses = async () => {
  try {
    const response = await authFetch('/api/expenses');
    if (response.ok) {
      expenses.value = await response.json();
      
      // Auto-select current month if available, else first available
      if (!selectedMonth.value && availableMonths.value.length > 0) {
          const currentMonthVal = new Date().toISOString().slice(0, 7); // YYYY-MM
          const exists = availableMonths.value.find(m => m.value === currentMonthVal);
          selectedMonth.value = exists ? currentMonthVal : availableMonths.value[0].value;
      }
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
  }
};

const availableMonths = computed(() => {
    const months = new Set<string>();
    expenses.value.forEach(e => {
        // e.date YYYY-MM-DD
        const m = e.date.substring(0, 7);
        months.add(m);
    });
    
    return Array.from(months).sort().reverse().map(m => {
        const [y, monthNum] = m.split('-');
        const dateObj = new Date(parseInt(y), parseInt(monthNum) - 1);
        const label = dateObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        // Capitalize first letter
        return { 
            value: m, 
            label: label.charAt(0).toUpperCase() + label.slice(1) 
        };
    });
});

const filteredExpenses = computed(() => {
    if (activeFilter.value === 'today') {
        const today = getTodayString();
        return expenses.value.filter(e => e.date === today);
    }
    if (activeFilter.value === 'day') {
        return expenses.value.filter(e => e.date === selectedDate.value);
    }
    if (activeFilter.value === 'month') {
        return expenses.value.filter(e => e.date.startsWith(selectedMonth.value));
    }
    return expenses.value;
});

const handleDelete = async (id: number) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;
  
  try {
    const response = await authFetch(`/api/expenses/${id}`, {
      method: 'DELETE',
    });
    
    if (response.ok) {
        expenses.value = expenses.value.filter(e => e.id !== id);
    } else {
        alert('Error al eliminar gasto');
    }
  } catch (error) {
    console.error('Error deleting expense:', error);
  }
};

onMounted(() => {
  fetchExpenses();
});

const handleEdit = (id: number) => {
   router.push(`/expenses/${id}/edit`);
};

const handleAddNew = () => {
   router.push('/expenses/create');
};
</script>
