<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" @click.self="close">
    <div class="flex items-center justify-center min-h-screen px-4">
      <div class="fixed inset-0 bg-black opacity-50"></div>
      
      <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl max-w-md w-full p-6 z-10">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Configurar Sustitución
          </h3>
          <button @click="close" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- Variación seleccionada -->
          <div class="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg">
            <p class="text-xs text-gray-600 dark:text-gray-400">Variación:</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ variantName }}</p>
          </div>

          <!-- Ingrediente a sustituir -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ingrediente a Sustituir
            </label>
            <select 
              v-model="localReplacedIngredient"
              class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
            >
              <option value="">Seleccionar ingrediente...</option>
              <option v-for="ing in recipeIngredients" :key="ing" :value="ing">
                {{ ing }}
              </option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Ingrediente de la receta que será reemplazado</p>
          </div>

          <!-- Producto de inventario -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Producto de Inventario
            </label>
            <div class="relative">
              <input
                v-model="inventorySearch"
                @input="showSuggestions = true"
                @focus="showSuggestions = true"
                @blur="hideSuggestions"
                type="text"
                placeholder="Buscar producto..."
                class="w-full h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm"
              />
              <div
                v-if="showSuggestions && filteredProducts.length > 0"
                class="absolute top-full left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg"
              >
                <button
                  v-for="prod in filteredProducts"
                  :key="prod"
                  @mousedown.prevent="selectProduct(prod)"
                  class="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {{ prod }}
                </button>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">Producto que se usará en su lugar</p>
          </div>

          <!-- Resumen -->
          <div v-if="localReplacedIngredient && localInventoryProduct" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p class="text-xs text-green-700 dark:text-green-400 font-medium mb-1">Sustitución configurada:</p>
            <p class="text-sm text-green-900 dark:text-green-300">
              <span class="font-medium">{{ localReplacedIngredient }}</span>
              <span class="mx-2">→</span>
              <span class="font-medium">{{ localInventoryProduct }}</span>
            </p>
          </div>
        </div>

        <div class="flex gap-3 mt-6">
          <button
            @click="close"
            class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            @click="save"
            :disabled="!localReplacedIngredient || !localInventoryProduct"
            class="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  variantName: string;
  recipeIngredients: string[];
  inventoryProducts: string[];
  replacedIngredient?: string;
  inventoryProduct?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [{ replacedIngredient: string; inventoryProduct: string }];
}>();

const localReplacedIngredient = ref(props.replacedIngredient || '');
const localInventoryProduct = ref(props.inventoryProduct || '');
const inventorySearch = ref(props.inventoryProduct || '');
const showSuggestions = ref(false);

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    localReplacedIngredient.value = props.replacedIngredient || '';
    localInventoryProduct.value = props.inventoryProduct || '';
    inventorySearch.value = props.inventoryProduct || '';
  }
});

const filteredProducts = computed(() => {
  if (!inventorySearch.value) return props.inventoryProducts.slice(0, 10);
  const lower = inventorySearch.value.toLowerCase();
  return props.inventoryProducts.filter(p => p.toLowerCase().includes(lower)).slice(0, 10);
});

const selectProduct = (product: string) => {
  localInventoryProduct.value = product;
  inventorySearch.value = product;
  showSuggestions.value = false;
};

const hideSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false;
  }, 200);
};

const close = () => {
  emit('close');
};

const save = () => {
  if (localReplacedIngredient.value && localInventoryProduct.value) {
    emit('save', {
      replacedIngredient: localReplacedIngredient.value,
      inventoryProduct: localInventoryProduct.value
    });
  }
};
</script>
