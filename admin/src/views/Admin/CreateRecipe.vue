<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 class="font-semibold text-lg text-gray-800 dark:text-white/90 mb-6">Nueva Receta</h3>
      
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            <!-- Nombre de Receta (6 cols) -->
            <div class="col-span-12 md:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Nombre de la Receta
                </label>
                <input
                  v-model="formData.name"
                  type="text"
                  placeholder="Ej. Latte"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  required
                />
            </div>

            <!-- Categoría (6 cols) -->
            <div class="col-span-12 md:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Categoría
                </label>
                <div class="relative z-20 bg-transparent">
                  <select
                    v-model="formData.category"
                    class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                  >
                    <option value="" disabled selected>Seleccionar</option>
                    <option value="Bebidas">Bebidas</option>
                    <option value="Barra de Café">Barra de Café</option>
                    <option value="Sandwiches">Sandwiches</option>
                    <option value="Desayunos">Desayunos</option>
                    <option value="Menú del Día">Menú del Día</option>
                    <option value="Huevos">Huevos</option>
                  </select>
                   <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                    <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </span>
                </div>
            </div>

            <div class="col-span-12">
                 <hr class="my-2 border-gray-200 dark:border-gray-700" />
            </div>

             <!-- Variant Tabs -->
            <div class="col-span-12">
                <div class="flex items-center justify-between mb-4">
                     <h4 class="font-semibold text-base text-gray-800 dark:text-white/90">Variantes / Tamaños</h4>
                     <button type="button" @click="addVariant" class="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                        + Agregar Variante
                     </button>
                </div>
               
                <div class="flex gap-2 overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button 
                        v-for="(variant, idx) in variants" 
                        :key="idx"
                        type="button"
                        @click="activeVariantIndex = idx"
                        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap relative group"
                        :class="activeVariantIndex === idx ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                    >
                         <input 
                            v-if="activeVariantIndex === idx"
                            v-model="variant.name"
                            @click.stop
                            class="bg-transparent border-none p-0 w-20 text-center focus:ring-0 font-medium" 
                            placeholder="Nombre Var."
                        />
                        <span v-else>{{ variant.name }}</span>

                        <span v-if="variants.length > 1" @click.stop="removeVariant(idx)" class="ml-2 text-gray-400 hover:text-red-500 cursor-pointer hidden group-hover:inline-block">&times;</span>
                    </button>
                </div>

                 <!-- Variant Content -->
                 <div v-if="activeVariant">
                     <!-- Add Ingredient Form -->
                    <div class="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-4 rounded-xl dark:bg-gray-800 mb-6 border border-gray-200 dark:border-gray-700">
                         <!-- Product Autocomplete -->
                        <div class="flex-1 relative w-full">
                            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                                Buscar Insumo para <span class="font-bold text-gray-700">{{ activeVariant.name }}</span>
                            </label>
                            <div class="relative">
                                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg class="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                </div>
                                <input 
                                    type="text" 
                                    v-model="newItem.productName"
                                    @input="handleProductInput"
                                    @focus="showSuggestions = true"
                                    @blur="handleBlur"
                                    placeholder="Escribe para buscar..." 
                                    class="pl-10 dark:bg-dark-900 h-[38px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                                    :class="{'border-green-500 focus:border-green-500 ring-green-500/10': selectedProductIsValid}"
                                />
                                 <div v-if="selectedProductIsValid" class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span class="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                        ${{ newItem.unitCost.toFixed(2) }} / {{ newItem.unit }}
                                    </span>
                                </div>
                            </div>
                            
                             <!-- Suggestions Dropdown -->
                            <div v-if="showSuggestions && productSuggestions.length > 0" class="absolute left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                                <button 
                                    type="button"
                                    v-for="suggestion in productSuggestions" 
                                    :key="suggestion"
                                    @click="selectProduct(suggestion)"
                                    class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
                                >
                                    {{ suggestion }}
                                </button>
                            </div>
                        </div>
                        
                        <div class="w-full md:w-28">
                            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Cantidad</label>
                            <input type="number" v-model.number="newItem.quantity" min="0" step="0.01" class="dark:bg-dark-900 h-[38px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-600 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" />
                        </div>

                        <div class="w-full md:w-28">
                            <label class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Unidad</label>
                             <input 
                                type="text" 
                                :value="newItem.unit" 
                                disabled 
                                class="dark:bg-dark-900 h-[38px] w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 shadow-theme-xs cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            />
                        </div>
                        
                        <div class="w-full md:w-auto">
                            <Button type="button" size="sm" variant="primary" @click="addItemToVariant" class="w-full h-[38px] flex items-center justify-center">
                                 <span class="text-xl">+</span>
                            </Button>
                        </div>
                    </div>

                    <!-- Added Ingredients List for Active Variant -->
                    <div v-if="activeVariant.items.length > 0" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
                        <div class="max-w-full overflow-x-auto">
                            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead class="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Insumo</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unidad</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo Unit (Est.)</th>
                                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th class="px-4 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                                    <tr v-for="(item, index) in activeVariant.items" :key="index">
                                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">{{ item.productName }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500">{{ item.quantity }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500">{{ item.unit }}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500">${{ item.unitCost.toFixed(2) }}</td>
                                        <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">${{ item.totalCost.toFixed(2) }}</td>
                                        <td class="px-4 py-3 text-right">
                                            <button type="button" @click="removeItemFromVariant(index)" class="text-red-500 hover:text-red-700">&times;</button>
                                        </td>
                                    </tr>
                                </tbody>
                                <tfoot class="bg-gray-50 dark:bg-gray-800">
                                     <tr>
                                        <td colspan="4" class="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">Costo Total ({{activeVariant.name}}):</td>
                                        <td class="px-4 py-3 font-bold text-brand-600">${{ activeVariantTotalCost.toFixed(2) }}</td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                     <p v-else class="text-gray-500 text-sm italic text-center py-4">No hay insumos agregados para {{ activeVariant.name }}.</p>
                 </div>
            </div>

            <!-- Actions -->
             <div class="col-span-12 flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6 dark:border-gray-700">
                <Button size="md" variant="outline" @click="$router.back()">Cancelar</Button>
                <Button size="md" variant="primary" type="submit">Guardar Receta</Button>
             </div>

        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Button from '@/components/ui/Button.vue';
import { authFetch } from '@/utils/api';

const router = useRouter();

const formData = reactive({
    name: '',
    category: ''
});

// Variants Logic
const variants = ref([ 
    { name: 'Estándar', items: [] as any[] }
]);
const activeVariantIndex = ref(0);
const activeVariant = computed(() => variants.value[activeVariantIndex.value]);

const addVariant = () => {
    variants.value.push({ name: 'Nueva Var.', items: [] });
    activeVariantIndex.value = variants.value.length - 1;
};

const removeVariant = (index: number) => {
    if (variants.value.length <= 1) return;
    variants.value.splice(index, 1);
    if (activeVariantIndex.value >= variants.value.length) {
        activeVariantIndex.value = variants.value.length - 1;
    }
};

const activeVariantTotalCost = computed(() => {
    return activeVariant.value?.items.reduce((sum, item) => sum + item.totalCost, 0) || 0;
});


const newItem = reactive({
    productName: '',
    quantity: 1,
    unit: 'Pzas',
    unitCost: 0 
});

// Autocomplete
const showSuggestions = ref(false);
const productSuggestions = ref<string[]>([]);
const selectedProductIsValid = ref(false);

const handleProductInput = async () => {
    selectedProductIsValid.value = false; 
    
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
    } catch (e) {
        console.error(e);
    }
};

const handleBlur = () => {
    setTimeout(() => {
        showSuggestions.value = false;
    }, 200);
};

const selectProduct = async (name: string) => {
    newItem.productName = name;
    selectedProductIsValid.value = true;
    showSuggestions.value = false;
    
    // Fetch average cost and unit
    try {
        const response = await authFetch(`/api/products/cost?name=${encodeURIComponent(name)}`);
        if(response.ok) {
            const data = await response.json();
            newItem.unitCost = Number(data.cost) || 0;
            if (data.unit) newItem.unit = data.unit;
        }
    } catch(e) {
        console.error(e);
    }
};

const addItemToVariant = () => {
    if (!selectedProductIsValid.value) {
        alert('Debes seleccionar un insumo válido de la lista (haz clic en la sugerencia)');
        return;
    }

    if (!newItem.productName || !newItem.productName.trim() || newItem.quantity <= 0) {
        alert('Verifica el insumo y cantidad');
        return;
    }

    activeVariant.value.items.push({
        ...newItem,
        productName: newItem.productName.trim(),
        totalCost: newItem.quantity * newItem.unitCost
    });

    // Reset
    newItem.productName = '';
    newItem.quantity = 1;
    newItem.unit = 'Pzas';
    newItem.unitCost = 0;
    selectedProductIsValid.value = false;
};

const removeItemFromVariant = (index: number) => {
    activeVariant.value.items.splice(index, 1);
};


const handleSubmit = async () => {
    if (!formData.name) {
        alert('Completa el nombre de la receta');
        return;
    }

    // Basic validation: At least one variant has content
    const hasItems = variants.value.some(v => v.items.length > 0);
    if (!hasItems) {
        alert('Agrega al menos un insumo en alguna variante');
        return;
    }

    try {
        const response = await authFetch('/api/recipes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: formData.name,
                category: formData.category,
                variants: variants.value
            })
        });

        if (response.ok) {
            router.push('/recipes');
        } else {
            alert('Error al guardar receta');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
};
</script>
