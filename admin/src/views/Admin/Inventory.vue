<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
       <!-- Header & Actions -->
       <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
         <div class="flex items-center gap-4">
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Inventario</h2>
            <!-- Filter Tabs -->
            <div class="flex items-center gap-3">
                <div class="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800">
                    <button 
                        v-for="filter in costTypeFilters" 
                        :key="filter.value"
                        @click="activeCostTypeFilter = filter.value"
                        :class="[
                            'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                            activeCostTypeFilter === filter.value 
                                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        ]"
                    >
                        {{ filter.label }}
                    </button>
                </div>
            </div>
         </div>
         <div class="flex flex-col sm:flex-row gap-3 items-center">
             <!-- Search Bar -->
             <div class="relative w-full sm:w-auto">
                 <input 
                     v-model="searchTerm" 
                     type="text" 
                     placeholder="Buscar producto..." 
                     class="pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 w-full sm:w-64"
                 >
                 <SearchIcon class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
             </div>

             <Button variant="primary" size="sm" @click="printInventory">
                 Imprimir Inventario
              </Button>
             <Button variant="primary" size="sm">
                 Lista de Compras
              </Button>
             <button 
                @click="openNewProductModal"
                class="flex items-center justify-center w-8 h-8 rounded-full bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-sm"
                title="Nuevo Producto"
             >
                 <PlusIcon class="w-5 h-5" />
             </button>
         </div>
       </div>

      <!-- Table Container (Screen Only) -->
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] print:hidden">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Producto</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tipo</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Existencia</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">U/M</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Costo Promedio</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Última Compra</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="paginatedInventory.length === 0">
                <td colspan="6" class="px-5 py-8 text-center text-gray-500 text-sm">No hay inventario registrado</td>
              </tr>
              <tr v-for="(item, index) in paginatedInventory" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ item.productName }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span :class="item.costType === 'Directo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ item.costType || 'Directo' }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <input 
                    type="number" 
                    step="any"
                    :value="Number(item.stock)"
                    @keyup.enter="handleStockEdit(item, $event)"
                    @blur="handleStockEdit(item, $event)"
                    class="w-24 px-2 py-1 rounded border border-transparent hover:border-gray-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-transparent text-gray-800 font-medium text-theme-sm dark:text-white/90 transition-colors"
                   />
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.unit }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">${{ item.averageCost }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.lastPurchase }}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <!-- Pagination Controls -->
         <div class="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800" v-if="inventory.length > itemsPerPage">
             <div class="text-sm text-gray-500">
                 Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, filteredInventory.length) }} de {{ filteredInventory.length }} resultados
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

       <!-- Print Template (Visible only on print) -->
       <div class="hidden print:block print-container">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8 border-b pb-4">
                <div class="w-1/3 text-left">
                    <img src="/logo-bambu.png" alt="Logo" class="h-16 object-contain" />
                </div>
                <div class="w-1/3 text-center">
                    <h1 class="text-3xl font-bold text-gray-900 tracking-wide">INVENTARIO</h1>
                </div>
                <div class="w-1/3 text-right">
                    <p class="text-sm text-gray-600 font-medium">{{ new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}</p>
                </div>
            </div>

            <!-- Items Columns -->
             <div class="columns-2 gap-8">
                 <div v-for="(item, index) in inventory" :key="index" class="break-inside-avoid mb-3 border-b border-gray-200 pb-2">
                     <div class="flex items-center justify-between">
                         <div class="flex-1 pr-4">
                             <div class="font-bold text-gray-900 text-base mb-1">{{ item.productName }}</div>
                             <div class="text-xs text-gray-500 font-medium">
                                 Última compra: {{ item.lastPurchase }} <span class="mx-1">|</span> Stock Sist: {{ Number(item.stock).toFixed(3) }} {{ item.unit }}
                             </div>
                         </div>
                         <div class="w-24 border border-gray-400 h-10 rounded bg-white relative">
                             <!-- Checkbox/writing area -->
                         </div>
                     </div>
                 </div>
             </div>
       </div>

    </div>
       <!-- New Product Modal -->
       <Modal v-if="showNewProductModal" :fullScreenBackdrop="true" @close="closeNewProductModal">
            <template #body>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden relative" @click.stop>
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white">Nuevo Producto</h3>
                        <button @click="closeNewProductModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            &times;
                        </button>
                    </div>
                    <div class="p-6 space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
                            <input 
                                type="text"
                                v-model="newProductForm.productName"
                                placeholder="Ej. Servilletas"
                                class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Existencias Iniciales</label>
                                <input 
                                    type="number"
                                    step="any"
                                    v-model="newProductForm.quantity"
                                    class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad</label>
                                <select 
                                    v-model="newProductForm.unit"
                                    class="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-brand-500"
                                >
                                    <option value="" disabled>Seleccionar...</option>
                                    <option v-for="u in availableUnits" :key="u" :value="u">{{ u }}</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end gap-3">
                        <Button variant="outline" @click="closeNewProductModal">Cancelar</Button>
                        <Button variant="primary" @click="saveNewProduct">Guardar</Button>
                    </div>
                </div>
            </template>
       </Modal>
       
       <!-- Edit Stock Confirmation Modal -->
       <Modal v-if="showEditConfirm" :fullScreenBackdrop="true" @close="cancelEdit">
            <template #body>
                <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden relative" @click.stop>
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2">Confirmar ajuste de stock</h3>
                        <p class="text-gray-600 dark:text-gray-300 mb-6">
                            ¿Estás seguro que deseas actualizar el stock de <span class="font-bold">{{ editItem?.productName }}</span> 
                            de <span class="font-bold">{{ editItem?.oldStock }}</span> a <span class="font-bold">{{ editItem?.newStock }}</span>?
                        </p>
                        <div class="flex justify-end gap-3">
                            <Button variant="outline" @click="cancelEdit">Cancelar</Button>
                            <Button variant="primary" @click="confirmEdit">Confirmar</Button>
                        </div>
                    </div>
                </div>
            </template>
       </Modal>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import AdminLayout from "@/components/layout/AdminLayout.vue";
import Button from "@/components/ui/Button.vue";
import Modal from "@/components/ui/Modal.vue";
import Alert from "@/components/ui/Alert.vue";
import { SearchIcon, PlusIcon } from 'lucide-vue-next';

import { authFetch } from '@/utils/api';

const inventory = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 10;

const costTypeFilters = [
    { label: 'Todos', value: 'all' },
    { label: 'Directo', value: 'Directo' },
    { label: 'Indirecto', value: 'Indirecto' },
];

const activeCostTypeFilter = ref('all');
const searchTerm = ref('');

const fetchInventory = async () => {
  try {
    const response = await authFetch('/api/inventory');
    if (response.ok) {
      inventory.value = await response.json();
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
  }
};

// Pagination Logic
const filteredInventory = computed(() => {
    let filtered = inventory.value;
    
    // Filter by cost type
    if (activeCostTypeFilter.value !== 'all') {
        filtered = filtered.filter(item => item.costType === activeCostTypeFilter.value);
    }
    
    // Filter by search term
    if (searchTerm.value.trim()) {
        const search = searchTerm.value.toLowerCase().trim();
        filtered = filtered.filter(item => 
            item.productName.toLowerCase().includes(search)
        );
    }
    
    return filtered;
});

const totalPages = computed(() => Math.ceil(filteredInventory.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => currentPage.value * itemsPerPage);
const paginatedInventory = computed(() => {
    // Reset to page 1 when filters change
    return filteredInventory.value.slice(startIndex.value, endIndex.value);
});

const printInventory = () => {
    window.print();
};

const availableUnits = ['Pzas', 'Gr', 'Kg', 'Lt', 'Ml'];

// New Product Modal Logic
const showNewProductModal = ref(false);
const newProductForm = ref({
    productName: '',
    quantity: 0,
    unit: ''
});

const openNewProductModal = () => {
    newProductForm.value = {
        productName: '',
        quantity: 0,
        unit: ''
    };
    showNewProductModal.value = true;
};

const closeNewProductModal = () => {
    showNewProductModal.value = false;
};

const saveNewProduct = async () => {
    if (!newProductForm.value.productName || !newProductForm.value.unit) {
        alert('Por favor complete nombre y unidad');
        return;
    }

    try {
        const response = await authFetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productName: newProductForm.value.productName,
                quantity: newProductForm.value.quantity,
                unit: newProductForm.value.unit,
                reason: 'Inventario Inicial (Nuevo Producto)'
            })
        });

        if (response.ok) {
            closeNewProductModal();
            fetchInventory();
        } else {
            alert('Error creando producto');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        alert('Error creando producto');
    }
};

// Inline Edit Logic
const showEditConfirm = ref(false);
const editItem = ref<{
    productName: string;
    oldStock: number;
    newStock: number;
    unit: string;
} | null>(null);

const handleStockEdit = (item: any, event: Event) => {
    const input = event.target as HTMLInputElement;
    const newValue = parseFloat(input.value);
    
    if (isNaN(newValue)) {
        // Reset valid if invalid
        input.value = item.stock.toString();
        return;
    }
    // Compare with small epsilon for floats or direct check
    if (Math.abs(newValue - item.stock) < 0.0001) return;

    // Prevent multiple modals if blur happens after enter
    if (showEditConfirm.value && editItem.value?.productName === item.productName) return;

    editItem.value = {
        productName: item.productName,
        oldStock: item.stock,
        newStock: newValue,
        unit: item.unit
    };
    showEditConfirm.value = true;
};

const cancelEdit = () => {
    showEditConfirm.value = false;
    editItem.value = null;
    fetchInventory(); // Reset inputs to original values via re-render
};

const confirmEdit = async () => {
    if (!editItem.value) return;

    const diff = editItem.value.newStock - editItem.value.oldStock;

    try {
        const response = await authFetch('/api/inventory/adjust', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productName: editItem.value.productName,
                quantity: diff,
                unit: editItem.value.unit,
                reason: 'Ajuste Manual (Edición en Tabla)'
            })
        });

        if (response.ok) {
            showEditConfirm.value = false;
            editItem.value = null;
            fetchInventory();
        } else {
            const err = await response.json();
            alert(`Error actualizando stock: ${err.error || 'Error desconocido'}`);
        }
    } catch (error: any) {
        console.error('Error updating stock:', error);
        alert(`Error de conexión: ${error.message}`);
    }
};

onMounted(() => {
  fetchInventory();
});
</script>

<style>
@media print {
  @page {
      size: letter;
      margin: 0.5in;
  }
  
  /* Hide everything by default */
  body * {
    visibility: hidden;
  }

  /* Show only the print container and its children */
  .print-container, .print-container * {
    visibility: visible;
  }

  /* Position the print container to fill the page */
  .print-container {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
    z-index: 9999;
  }
  
  /* Hide browser header/footers if possible (controlled by browser, but this helps layout) */
  /* Remove layout paddings/margins impacting print */
  html, body {
      margin: 0;
      padding: 0;
      overflow: visible;
  }
}
</style>
