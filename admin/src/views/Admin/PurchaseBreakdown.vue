<template>
  <AdminLayout>
    <div class="space-y-6">
        <!-- Header Info Card -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h3 class="font-semibold text-lg text-gray-800 dark:text-white/90 mb-4">Información del Ticket</h3>
            <div v-if="purchase" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                <div>
                    <span class="block text-gray-500 dark:text-gray-400">Ticket</span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ purchase.ticketNumber }}</span>
                </div>
                <div>
                    <span class="block text-gray-500 dark:text-gray-400">Total Ticket</span>
                    <span class="font-medium text-gray-800 dark:text-white/90">${{ purchase.total }}</span>
                </div>
                <div>
                    <span class="block text-gray-500 dark:text-gray-400">Proveedor</span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ purchase.provider }}</span>
                </div>
                 <div>
                    <span class="block text-gray-500 dark:text-gray-400">Fecha</span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ purchase.date }}</span>
                </div>
                 <div>
                    <span class="block text-gray-500 dark:text-gray-400">Forma de Pago</span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ purchase.paymentMethod }}</span>
                </div>
            </div>
            <div v-else class="text-gray-500">Cargando información...</div>
        </div>

        <!-- Capture Form -->
        <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
            <h4 class="font-semibold text-base text-gray-800 dark:text-white/90 mb-4">Agregar Concepto</h4>
            <form @submit.prevent="addItem">
                <div class="grid grid-cols-12 gap-4 items-end">
                     <!-- Product Name (2 cols) -->
                    <div class="col-span-6 md:col-span-2 relative group">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Producto</label>
                        <input 
                            type="text" 
                            v-model="newItem.productName"
                            @input="handleProductInput"
                            @focus="showSuggestions = true"
                            @blur="handleBlur"
                            placeholder="Nombre" 
                            class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                        <!-- Suggestions Dropdown -->
                        <div v-if="showSuggestions && productSuggestions.length > 0" class="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <button 
                                v-for="suggestion in productSuggestions" 
                                :key="suggestion"
                                @click="selectProduct(suggestion)"
                                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                            >
                                {{ suggestion }}
                            </button>
                        </div>
                    </div>

                    <!-- Type Selector (2 cols) -->
                    <div class="col-span-6 md:col-span-2">
                         <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Tipo</label>
                         <select v-model="newItem.costType" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                            <option value="Directo">Directo</option>
                            <option value="Indirecto">Indirecto</option>
                        </select>
                    </div>
                     <!-- Qty (1 col) -->
                    <div class="col-span-6 md:col-span-1">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Cant.</label>
                        <input type="number" v-model.number="newItem.quantity" @input="calculateSubtotal" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" min="0.00001" step="0.00001" required />
                    </div>
                     <!-- Unit (1 col) -->
                    <div class="col-span-6 md:col-span-1">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Unidad</label>
                        <select v-model="newItem.unit" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800">
                            <option value="Pzas">Pzas</option>
                            <option value="Gr">Gr</option>
                            <option value="Kg">Kg</option>
                            <option value="Lt">Lt</option>
                            <option value="Ml">Ml</option>
                        </select>
                    </div>
                     <!-- Price (1 col) -->
                    <div class="col-span-6 md:col-span-1">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">$ P. Unit</label>
                        <input type="number" v-model.number="newItem.unitPrice" @input="calculateSubtotal" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" min="0" step="0.00001" required />
                    </div>
                     <!-- Subtotal (1 col) - Readonly -->
                    <div class="col-span-6 md:col-span-1">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">$ Subtotal</label>
                        <input type="number" v-model.number="newItem.subtotal" @input="calculateUnitPrice" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 font-medium" step="0.00001" />
                    </div>
                     <!-- Discount (1 col) -->
                    <div class="col-span-6 md:col-span-1">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">$ Desc.</label>
                        <input type="number" v-model.number="newItem.discount" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" min="0" step="0.01" />
                    </div>
                     <!-- Total (2 cols) - Readonly -->
                     <div class="col-span-6 md:col-span-2">
                        <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">$ Total</label>
                        <div class="relative">
                            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-medium">$</span>
                            <input type="number" :value="calculatedTotal" class="h-[38px] w-full rounded-lg border border-gray-300 bg-transparent pl-7 pr-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 bg-gray-50 dark:bg-gray-800 font-normal" readonly />
                        </div>
                    </div>
                    <!-- Button (1 col) -->
                    <div class="col-span-6 md:col-span-1">
                        <Button type="submit" size="sm" variant="primary" class="w-full h-[38px] flex items-center justify-center">
                            +
                        </Button>
                    </div>
                </div>
            </form>
        </div>

        <!-- Items Table -->
        <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
             <div class="max-w-full overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cant.</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                             <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desc.</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th class="px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        <tr v-if="items.length === 0">
                            <td colspan="8" class="px-4 py-8 text-center text-sm text-gray-500">No hay conceptos agregados</td>
                        </tr>
                        <tr v-for="(item, index) in items" :key="index">
                            <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.productName }}</td>
                            <td class="px-4 py-3 text-sm text-gray-500">
                                <span :class="item.costType === 'Directo' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                                    {{ item.costType || 'Directo' }}
                                </span>
                            </td>
                            <td class="px-4 py-3 text-sm text-gray-500">{{ item.quantity }}</td>
                            <td class="px-4 py-3 text-sm text-gray-500">{{ item.unit }}</td>
                            <td class="px-4 py-3 text-sm text-gray-500">${{ item.unitPrice.toFixed(5) }}</td>
                            <td class="px-4 py-3 text-sm text-gray-500">${{ (item.quantity * item.unitPrice).toFixed(5) }}</td>
                            <td class="px-4 py-3 text-sm text-gray-500">${{ item.discount }}</td>
                             <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${{ item.total.toFixed(5) }}</td>
                            <td class="px-4 py-3 text-right">
                                <button @click="removeItem(index)" class="text-red-500 hover:text-red-700">
                                    &times;
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
             </div>
        </div>

        <div class="mt-8 flex flex-col items-end gap-4 border-t border-gray-100 pt-6 dark:border-gray-800">
             <div class="flex flex-col items-end gap-1">
                 <div class="flex items-center gap-4 text-sm">
                     <span class="text-gray-500">Total Ticket:</span>
                     <span class="font-medium text-gray-800 dark:text-gray-200">${{ purchase ? purchase.total : '0.00' }}</span>
                 </div>
                 <div class="flex items-center gap-4 text-sm">
                     <span class="text-gray-500">Total Desglosado:</span>
                     <span class="font-medium text-gray-800 dark:text-gray-200">${{ itemsTotal.toFixed(2) }}</span>
                 </div>
                 <div class="flex items-center gap-4 text-sm font-bold" :class="isBalanced ? 'text-brand-500' : 'text-error-500'">
                     <span>{{ isBalanced ? 'Balanceado' : 'Diferencia:' }}</span>
                     <span>${{ Math.abs(itemsTotal - (purchase ? Number(purchase.total) : 0)).toFixed(2) }}</span>
                 </div>
            </div>
            
            <Button 
                size="md" 
                variant="primary" 
                @click="saveBreakdown" 
                :disabled="!isBalanced"
                class="w-full sm:w-auto min-w-[180px]"
            >
                {{ purchase && purchase.status === 'Desglosado' ? 'Actualizar Desglose' : 'Guardar Desglose' }}
            </Button>
        </div>

    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Button from '@/components/ui/Button.vue'

const router = useRouter()
const route = useRoute()
const purchaseId = route.params.id

const purchase = ref<any>(null)
const items = ref<any[]>([])

const newItem = reactive({
    productName: '',
    costType: 'Directo',
    quantity: 1,
    unit: 'Pzas',
    unitPrice: 0,
    subtotal: 0,
    discount: 0
})

// Bidirectional Calculation
const calculateSubtotal = () => {
    // When Qty or Unit Price changes -> Update Subtotal
    if (newItem.quantity && newItem.unitPrice) {
        newItem.subtotal = parseFloat((newItem.quantity * newItem.unitPrice).toFixed(5));
    } else {
        newItem.subtotal = 0;
    }
}

const calculateUnitPrice = () => {
    // When Subtotal changes -> Update Unit Price
    if (newItem.quantity > 0 && newItem.subtotal) {
        // Calculate unit price, keep precision high (up to 5 dec) to avoid rounding errors on way back
        newItem.unitPrice = parseFloat((newItem.subtotal / newItem.quantity).toFixed(5));
    }
}

// Validation computed
// Removed calculatedSubtotal computed as it is now part of state

const calculatedTotal = computed(() => {
   // Use the state subtotal instead of recalculating
   const sub = newItem.subtotal || 0;
   return (sub - newItem.discount).toFixed(2);
});


const itemsTotal = computed(() => {
    return items.value.reduce((sum, item) => sum + item.total, 0);
});

const isBalanced = computed(() => {
    if (!purchase.value) return false;
    // Use a small epsilon for float comparison logic if needed, but for currency standard 2 decimals check
    return Math.abs(itemsTotal.value - Number(purchase.value.total)) < 0.01;
});

// Autocomplete Logic
const showSuggestions = ref(false);
const productSuggestions = ref<string[]>([]);

import { authFetch } from '@/utils/api';

// ... (inside script setup) ...

const handleProductInput = async () => {
    if (!newItem.productName || newItem.productName.length < 2) {
        productSuggestions.value = [];
        return;
    }
    
    try {
        const response = await authFetch(`/api/products/search?q=${encodeURIComponent(newItem.productName)}`);
        if (response.ok) {
            productSuggestions.value = await response.json();
            showSuggestions.value = true;
        }
    } catch (error) {
        console.error('Error fetching product suggestions:', error);
    }
};

const selectProduct = (name: string) => {
    newItem.productName = name;
    showSuggestions.value = false;
};

const handleBlur = () => {
    setTimeout(() => {
        showSuggestions.value = false;
    }, 200);
};

const fetchPurchase = async () => {
    try {
        const response = await authFetch(`/api/purchases/${purchaseId}`);
        if(response.ok) {
            purchase.value = await response.json();
            
            if(purchase.value.status === 'Desglosado') {
               // Fetch existing items
               try {
                   const itemsResponse = await authFetch(`/api/purchases/${purchaseId}/items`);
                   if (itemsResponse.ok) {
                       const existingItems = await itemsResponse.json();
                       items.value = existingItems.map((i: any) => ({
                           productName: i.productName,
                           costType: i.costType || 'Directo',
                           quantity: Number(i.quantity),
                           unit: i.unit,
                           unitPrice: Number(i.unitPrice),
                           discount: Number(i.discount),
                           total: Number(i.total)
                       }));
                   }
               } catch(err) {
                   console.error("Error fetching items", err);
               }
           }
        }
    } catch(e) {
        console.error(e);
    }
}

const addItem = () => {
    if(!newItem.productName || !newItem.productName.trim() || newItem.quantity <= 0 || newItem.unitPrice < 0) {
        alert('Por favor verifique los datos del item');
        return;
    }

    const item = {
        ...newItem,
        productName: newItem.productName.trim(), // Normalize
        total: (newItem.quantity * newItem.unitPrice) - newItem.discount,
        id: Date.now() // temporary ID
    };
    
    items.value.push(item);
    
    // Reset form
    newItem.productName = '';
    newItem.costType = 'Directo';
    newItem.quantity = 1;
    newItem.unit = 'Pzas';
    newItem.unitPrice = 0;
    newItem.subtotal = 0;
    newItem.discount = 0;
};

const removeItem = (index: number) => {
    items.value.splice(index, 1);
};

const saveBreakdown = async () => {
    if (!isBalanced.value) return;
    
    try {
        const response = await authFetch(`/api/purchases/${purchaseId}/items`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ items: items.value }),
        });

        if (!response.ok) {
             const error = await response.json();
             throw new Error(error.error || 'Error al guardar desglose');
        }

        router.push('/purchases');
    } catch (e: any) {
        console.error(e);
        alert(e.message);
    }
};

onMounted(() => {
    fetchPurchase();
});
</script>

