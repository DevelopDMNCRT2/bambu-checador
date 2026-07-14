<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Carta / Menú</h2>
        </div>
        <div class="flex gap-3">
             <!-- Search Bar -->
             <div class="relative w-full sm:w-auto">
                 <input 
                     v-model="searchTerm" 
                     type="text" 
                     placeholder="Buscar platillo..." 
                     class="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
                 >
                 <SearchIcon class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             </div>
             
             <Button variant="primary" size="sm" @click="$router.push('/menu/create')">
               Nuevo Platillo
             </Button>
        </div>
      </div>

      <!-- Table Container -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nombre</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Precio Venta</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Categoría</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Costo Real</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tipo</p>
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
              <tr v-if="paginatedItems.length === 0">
                <td colspan="7" class="px-5 py-8 text-center text-gray-500 text-sm">No hay platillos registrados</td>
              </tr>
              <tr v-for="item in paginatedItems" :key="item.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ item.name }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-800 font-medium text-theme-sm dark:text-white/90">${{ Number(item.price).toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.category }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                    <!-- Real Cost Logic -->
                   <div v-if="item.type === 'variable' && hasValidVariants(item)">
                       <div class="flex flex-col gap-1">
                            <p class="text-gray-500 text-theme-sm dark:text-gray-400 text-xs">
                                {{ getVariantCostsDisplay(item) }}
                            </p>
                            <span class="text-xs px-1.5 py-0.5 rounded w-fit" :class="calculateAvgMarginColor(item)">
                                {{ calculateAvgMargin(item) }}% Prom.
                            </span>
                       </div>
                   </div>
                   <div v-else class="flex items-center gap-2">
                        <p class="text-gray-500 text-theme-sm dark:text-gray-400">${{ Number(item.real_cost).toFixed(2) }}</p>
                        <!-- Profit Margin Indicator (Simple) -->
                        <span v-if="Number(item.price) > 0" class="text-xs px-1.5 py-0.5 rounded" :class="calculateMarginColor(item)">
                            {{ calculateMargin(item) }}% Margen
                        </span>
                   </div>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400 capitalize">{{ item.type || '-' }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        :class="item.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'">
                        {{ item.status === 'active' ? 'Activo' : 'Inactivo' }}
                   </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="$router.push(`/menu/${item.id}/edit`)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Eliminar" @click="handleDelete(item.id)">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <!-- Pagination Controls -->
         <div class="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800" v-if="filteredItems.length > itemsPerPage">
             <div class="text-sm text-gray-500">
                 Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, filteredItems.length) }} de {{ filteredItems.length }} resultados
             </div>
             <div class="flex gap-2">
                 <button 
                    @click="currentPage--" 
                    :disabled="currentPage === 1"
                    class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                 >
                     Anterior
                 </button>
                 <button 
                    @click="currentPage++" 
                    :disabled="currentPage === totalPages"
                    class="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800"
                 >
                     Siguiente
                 </button>
             </div>
         </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRouter } from "vue-router";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import Button from "@/components/ui/Button.vue";
import { TrashIcon, PencilIcon } from "@/icons";
import { SearchIcon } from 'lucide-vue-next';
import { authFetch } from '@/utils/api';

const router = useRouter();
const menuItems = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 10;
const searchTerm = ref('');

const fetchMenu = async () => {
  try {
    const response = await authFetch('/api/menu-items');
    if (response.ok) {
        menuItems.value = await response.json();
    } else {
        console.error('Error fetching menu: Response not OK', response.status);
    }
  } catch (error) {
    console.error('Error fetching menu:', error);
  }
};

const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este platillo?')) return;
    try {
        await authFetch(`/api/menu-items/${id}`, { method: 'DELETE' });
        fetchMenu();
    } catch (e) {
        console.error(e);
        alert('Error al eliminar');
    }
};

const calculateMargin = (item: any) => {
    const price = Number(item.price);
    const cost = Number(item.real_cost);
    if (price <= 0) return 0;
    return (((price - cost) / price) * 100).toFixed(0);
};

const calculateMarginColor = (item: any) => {
    const margin = Number(calculateMargin(item));
    return getMarginColorClass(margin);
};

const getMarginColorClass = (margin: number) => {
    if (margin >= 70) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (margin >= 50) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
};

// Variant Helpers
const hasValidVariants = (item: any) => {
    return item.variantGroups && item.variantGroups.length > 0 && item.variantGroups.some((g: any) => g.options.length > 0);
};

const getVariantCostsDisplay = (item: any) => {
    const costs: string[] = [];
    item.variantGroups.forEach((group: any) => {
        group.options.forEach((opt: any) => {
            if (opt.variantCost !== undefined) {
                costs.push(`$${Number(opt.variantCost).toFixed(2)}`);
            }
        });
    });
    // Filter unique costs or just join them? User asked to show both.
    // If too many, maybe simplified?
    // Let's join with pipes ' | '
    return costs.join(' | ');
};

const calculateAvgMargin = (item: any) => {
    let totalMargin = 0;
    let count = 0;
    const basePrice = Number(item.price);
    
    item.variantGroups.forEach((group: any) => {
        group.options.forEach((opt: any) => {
            // Price logic: usually base + extra. 
            // If extraPrice is high (like a size difference), use that?
            // Assuming simplified: Price = ItemPrice + OptExtraPrice
            const finalPrice = basePrice + Number(opt.extraPrice || 0);
            const cost = Number(opt.variantCost || 0);
            
            if (finalPrice > 0) {
                const margin = ((finalPrice - cost) / finalPrice) * 100;
                totalMargin += margin;
                count++;
            }
        });
    });
    
    if (count === 0) return 0;
    return (totalMargin / count).toFixed(0);
};

const calculateAvgMarginColor = (item: any) => {
    const margin = Number(calculateAvgMargin(item));
    return getMarginColorClass(margin);
};

// Pagination Logic
// Pagination Logic
const filteredItems = computed(() => {
    let items = menuItems.value;
    if (searchTerm.value.trim()) {
        const search = searchTerm.value.toLowerCase().trim();
        items = items.filter(item => 
            item.name.toLowerCase().includes(search) || 
            (item.category && item.category.toLowerCase().includes(search))
        );
    }
    return items;
});

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => currentPage.value * itemsPerPage);
const paginatedItems = computed(() => {
    return filteredItems.value.slice(startIndex.value, endIndex.value);
});

onMounted(() => {
  fetchMenu();
});
</script>
