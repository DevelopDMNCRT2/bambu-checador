<template>
  <AdminLayout>
    <div class="max-w-[1600px] mx-auto">
      <div class="flex items-center justify-between mb-6">
          <h3 class="font-semibold text-2xl text-gray-800 dark:text-white/90">Editar Platillo</h3>
      </div>
      
      <div class="grid grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: General Info & Variants (60%) -->
        <div class="col-span-12 lg:col-span-7 space-y-6">
            
            <!-- Card 1: General Info -->
            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                <h4 class="font-semibold text-lg text-gray-800 dark:text-white/90 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3">
                    Información General
                </h4>
                
                <div class="grid grid-cols-12 gap-5">
                    
                    <!-- Nombre -->
                    <div class="col-span-12">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Nombre del Platillo
                        </label>
                        <input
                          v-model="formData.name"
                          type="text"
                          placeholder="Ej. Latte Vainilla"
                          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                        />
                    </div>

                    <!-- Descripción -->
                    <div class="col-span-12">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Descripción
                        </label>
                        <textarea
                          v-model="formData.description"
                          rows="3"
                          placeholder="Descripción breve del platillo..."
                          class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 resize-none"
                        ></textarea>
                    </div>

                    <!-- Categoría -->
                    <div class="col-span-12 sm:col-span-4">
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
                            <option value="Dulcería">Dulcería</option>
                          </select>
                           <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                            <ChevronDownIcon class="w-5 h-5" />
                          </span>
                        </div>
                    </div>

                    <!-- Receta Base -->
                    <div class="col-span-12 sm:col-span-4 relative">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Receta Base
                        </label>
                        <div class="relative">
                            <input
                                type="text"
                                v-model="recipeSearch"
                                @focus="showRecipeSuggestions = true"
                                @input="handleRecipeSearchInput"
                                placeholder="Buscar receta..."
                                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                            />
                            <button v-if="recipeSearch" @click="clearRecipe" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>
                         <div v-if="showRecipeSuggestions && filteredRecipes.length > 0" 
                              class="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                            <button 
                                type="button"
                                v-for="recipe in filteredRecipes" 
                                :key="recipe.id"
                                @click="selectRecipe(recipe)"
                                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 flex justify-between"
                            >
                                <span>{{ recipe.name }}</span>
                                <span class="text-xs text-gray-400">{{ recipe.category }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Tipo -->
                    <div class="col-span-12 sm:col-span-4">
                        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                            Tipo
                        </label>
                        <div class="relative z-20 bg-transparent">
                          <select
                            v-model="formData.type"
                            :disabled="isTypeLocked"
                            class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="simple">Sencillo</option>
                            <option value="variable">Variable</option>
                          </select>
                           <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                            <ChevronDownIcon class="w-5 h-5" />
                          </span>
                        </div>
                    </div>

                </div>
            </div>

            <!-- Card 2: Variations (Only if Type is Variable) -->
            <div v-if="formData.type === 'variable'" class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                 <h4 class="font-semibold text-lg text-gray-800 dark:text-white/90 mb-5 border-b border-gray-100 dark:border-gray-800 pb-3 flex justify-between items-center">
                    <span>Variaciones del Platillo</span>
                </h4>

                <div class="space-y-6">
                    <!-- Dynamic Variation Groups from Recipe -->
                    <div v-if="selectedRecipe && selectedRecipe.variants && selectedRecipe.variants.length > 1" class="p-4 bg-brand-50/50 rounded-xl dark:bg-brand-900/10 border border-brand-100 dark:border-brand-800">
                        <div class="flex justify-between items-center mb-4">
                             <label class="block text-sm font-bold text-gray-800 dark:text-white">Grupo: Tamaño (Desde Receta)</label>
                        </div>
                        
                        <div class="space-y-3">
                             <div v-for="(rv, idx) in selectedRecipe.variants" :key="rv.id" class="grid grid-cols-12 gap-3 items-center">
                                 <div class="col-span-6">
                                      <input type="text" :value="rv.name" disabled class="h-9 w-full rounded border border-gray-200 bg-gray-100 px-3 text-sm text-gray-500 cursor-not-allowed" />
                                 </div>
                                  <div class="col-span-6">
                                      <div class="relative">
                                        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                        <input 
                                            v-model.number="rv.extraPrice" 
                                            type="number" 
                                            placeholder="Precio Extra" 
                                            min="0"
                                            class="pl-6 h-9 w-full rounded border border-gray-300 px-2 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500" 
                                        />
                                      </div>
                                 </div>
                             </div>
                        </div>
                    </div>

                    <!-- Custom Manual Groups -->
                    <draggable 
                        v-model="customGroups" 
                        item-key="id"
                        handle=".drag-handle"
                        :animation="200"
                        class="space-y-6"
                    >
                        <template #item="{ element: group, index: gIdx }">
                            <div class="p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 relative group">
                                <button @click="removeCustomGroup(gIdx)" class="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <TrashIcon class="w-4 h-4" />
                                </button>
                                
                                <!-- Drag Handle -->
                                <div class="drag-handle absolute top-2 left-2 cursor-move opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="9" cy="5" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                                </div>

                                <div class="mb-3 pl-6"> <!-- Added padding for handle -->
                                    <label class="text-xs text-gray-500 mb-1 block">Nombre del Grupo</label>
                                    <input 
                                        v-model="group.name"
                                        type="text" 
                                        placeholder="Ej. Tipo de Leche"
                                        class="dark:bg-dark-900 h-9 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-brand-300 focus:ring-brand-500/10"
                                    />
                                </div>

                                <div class="space-y-3 pl-6"> <!-- Added padding to align with header -->
                                     <div v-for="(v, vIdx) in group.options" :key="vIdx" class="grid grid-cols-12 gap-3 items-center">
                                         <input v-model="v.name" type="text" placeholder="Opción" class="col-span-5 h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" />
                                         <div class="relative col-span-2">
                                             <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 text-xs font-medium">+ $</span>
                                             <input v-model.number="v.extraPrice" type="number" min="0" class="pl-8 w-full h-10 rounded-lg border border-gray-300 dark:border-gray-600 px-3 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" />
                                         </div>
                                         <div class="col-span-4 flex items-center justify-end gap-3">
                                             <div class="flex-1 text-xs text-right truncate">
                                                 <span v-if="v.replacedIngredientName && v.inventoryProductName" class="text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                                                     {{ v.replacedIngredientName }} → {{ v.inventoryProductName }}
                                                 </span>
                                                 <span v-else class="text-gray-400 dark:text-gray-500 italic">Sin sustitución</span>
                                             </div>
                                             <button 
                                                 @click="openSubstitutionModal(gIdx, vIdx)"
                                                 type="button"
                                                 class="p-2 text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                 title="Configurar sustitución de inventario"
                                             >
                                                 <LightningIcon class="w-5 h-5 text-brand-600" />
                                             </button>
                                         </div>
                                         <button @click="removeOptionFromGroup(gIdx, vIdx)" class="col-span-1 text-gray-400 hover:text-red-500 flex justify-center p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><TrashIcon class="w-4 h-4" /></button>
                                     </div>
                                     <button @click="addOptionToGroup(gIdx)" class="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1 mt-3 px-1">
                                         + Agregar Opción
                                     </button>
                                </div>
                            </div>
                        </template>
                    </draggable>

                    <Button size="sm" variant="outline" class="w-full border-dashed mt-4" @click="addCustomGroup">
                        + Agregar Nuevo Grupo de Variaciones
                    </Button>
                </div>
            </div>

        </div>

        <!-- Right Column: Settings & Price (40%) -->
        <div class="col-span-12 lg:col-span-5 space-y-6">
            
            <!-- Publishing & Price Card -->
            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                 
                 <!-- Save Button (Primary) -->
                 <Button size="md" variant="primary" class="w-full mb-6 font-medium shadow-brand-500/20 shadow-md h-11" @click="handleSubmit">
                    Guardar Cambios
                 </Button>

                 <div class="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <span class="text-sm font-medium transition-colors duration-200" 
                          :class="formData.isPublic ? 'text-brand-600 font-bold' : 'text-gray-500'">
                        {{ formData.isPublic ? 'Publicado' : 'Privado' }}
                    </span>
                     <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" v-model="formData.isPublic" class="sr-only peer">
                        <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-500"></div>
                    </label>
                 </div>

                 <div class="mb-4">
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                        Precio Base
                    </label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-serif text-lg italic">$</span>
                         <input
                          v-model.number="formData.price"
                          type="number"
                          min="0"
                          placeholder="0.00"
                          class="pl-8 text-base font-semibold dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        />
                    </div>
                 </div>

                 <div class="mt-4 p-4 bg-gray-50 rounded-xl dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                     <span class="text-xs text-gray-500 uppercase font-semibold">Costo Real {{ formData.type === 'variable' ? '(Variantes)' : '(Base)' }}</span>
                     
                     <!-- Variable Case -->
                     <div v-if="formData.type === 'variable' && allVariantCalculations.length > 1" class="flex flex-col gap-1 mt-1">
                         <span class="text-lg font-bold text-gray-600 dark:text-gray-400 select-none">
                             {{ formattedVariantCosts }}
                         </span>
                         <div class="flex items-center gap-2">
                             <span class="text-xs text-gray-500">Promedio:</span>
                             <span class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400">
                                 {{ averageMargin }}% Margen
                             </span>
                         </div>
                     </div>

                     <!-- Simple Case -->
                     <div v-else class="flex items-center gap-2 mt-1">
                         <span class="text-lg font-bold text-gray-600 dark:text-gray-400 select-none">$ {{ baseCost.toFixed(2) }}</span>
                         <span class="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full dark:bg-green-900/30 dark:text-green-400" v-if="formData.price > 0 && baseCost > 0">
                             {{ ((formData.price - baseCost) / formData.price * 100).toFixed(0) }}% Margen
                         </span>
                     </div>
                 </div>
            </div>

            <!-- Image Upload -->
            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                 <h4 class="font-semibold text-sm text-gray-800 dark:text-white/90 mb-4">
                    Imagen del Platillo
                </h4>
                
                <div v-if="!imagePreview" 
                     class="relative flex flex-col items-center justify-center w-full h-40 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700 transition-colors"
                     @click="triggerFileInput"
                     @dragover.prevent
                     @drop.prevent="handleDrop"
                >
                    <div class="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg class="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p class="mb-2 text-xs text-gray-500 dark:text-gray-400"><span class="font-semibold">Click para subir</span> o arrastra</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG (MAX. 2MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" class="hidden" accept="image/*" @change="handleFileChange" ref="fileInput" />
                </div>

                <div v-else class="relative w-full h-48 rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-700">
                    <img :src="imagePreview" alt="Preview" class="w-full h-full object-cover" />
                    <button 
                        @click="removeImage"
                        class="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                        <TrashIcon class="w-4 h-4" />
                    </button>
                     <div class="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center truncate">
                        {{ imageFile?.name || 'Imagen Actual' }}
                    </div>
                </div>
            </div>

        </div>

      </div>
    </div>
    
    <!-- Substitution Configuration Modal -->
    <SubstitutionModal
      :isOpen="substitutionModal.isOpen"
      :variantName="substitutionModal.variantName"
      :recipeIngredients="recipeIngredients"
      :inventoryProducts="inventoryProducts"
      :replacedIngredient="substitutionModal.replacedIngredient"
      :inventoryProduct="substitutionModal.inventoryProduct"
      @close="closeSubstitutionModal"
      @save="saveSubstitution"
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import draggable from 'vuedraggable';
import { useRouter, useRoute } from 'vue-router';

import AdminLayout from '@/components/layout/AdminLayout.vue';
import Button from '@/components/ui/Button.vue';
import SubstitutionModal from '@/components/SubstitutionModal.vue';
import { authFetch } from '@/utils/api';
import { 
    ChevronDownIcon,
    TrashIcon,
    SwitchIcon,
    LightningIcon
} from '@/icons';

const router = useRouter();
const route = useRoute();
const dishId = route.params.id;

// Image Logic
const fileInput = ref<HTMLInputElement | null>(null);
const imageFile = ref<File | null>(null);
const imagePreview = ref<string | null>(null);

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        processFile(target.files[0]);
    }
};

const handleDrop = (event: DragEvent) => {
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
        processFile(event.dataTransfer.files[0]);
    }
};

const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
        alert('Solo se permiten archivos de imagen.');
        return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB limit
         alert('La imagen no debe superar los 2MB.');
         return;
    }
    
    imageFile.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagePreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
};

const removeImage = () => {
    imageFile.value = null;
    imagePreview.value = null;
    if (fileInput.value) fileInput.value.value = '';
};


const formData = reactive({
    name: '',
    description: '',
    category: '',
    type: 'simple',
    price: 0,
    isPublic: false,
    recipeId: null as number | null
});

// Recipe Logic
const recipes = ref<any[]>([]);
const recipeSearch = ref('');
const showRecipeSuggestions = ref(false);
const selectedRecipe = ref<any>(null);
const isTypeLocked = ref(false);

const filteredRecipes = computed(() => {
    if (!recipeSearch.value) return [];
    return recipes.value.filter(r => r.name.toLowerCase().includes(recipeSearch.value.toLowerCase()));
});

const loadRecipes = async () => {
    try {
         const response = await authFetch('/api/recipes');
         if (response.ok) recipes.value = await response.json();
    } catch (e) {
        console.error(e);
    }
};

const handleRecipeSearchInput = () => {
    showRecipeSuggestions.value = true;
    if (recipeSearch.value === '') {
        clearRecipe();
    }
};

const clearRecipe = () => {
    recipeSearch.value = '';
    selectedRecipe.value = null;
    formData.recipeId = null;
    isTypeLocked.value = false;
    // Keep user selected type logic if clearing
    if (formData.type === 'variable') {
         // Optionally reset to simple or leave as is. CreateDish logic was:
         formData.type = 'simple';
    }
};

const selectRecipe = async (recipe: any) => {
    recipeSearch.value = recipe.name;
    formData.recipeId = recipe.id;
    showRecipeSuggestions.value = false;
    
    // Fetch full details for variants
    try {
        const response = await authFetch(`/api/recipes/${recipe.id}`);
        if (response.ok) {
            const fullRecipe = await response.json();
            selectedRecipe.value = fullRecipe;

            // Logic: if recipe has > 1 variant, force variable type
            if (fullRecipe.variants && fullRecipe.variants.length > 1) {
                formData.type = 'variable';
                isTypeLocked.value = true;
                
                // Initialize extra prices for existing variants
                fullRecipe.variants.forEach((v: any) => {
                    // Try to preserve existing extraPrices if we are editing and they matched?
                    // For simplicity, we init to 0, then we will override with loaded values below.
                    v.extraPrice = 0; 
                });
                
                // Load ingredients for substitution modal
                loadRecipeIngredients();
            } else {
                isTypeLocked.value = false;
            }
        }
    } catch (e) { console.error(e) }
};

const baseCost = computed(() => {
    if (!selectedRecipe.value || !selectedRecipe.value.variants) return 0;
    // Default to first variant cost if multiple or single
    const v = selectedRecipe.value.variants[0];
    if (!v || !v.items) return 0;
    // Ensure we parse quantity/price as numbers if they are strings
    return v.items.reduce((sum: number, i: any) => sum + (Number(i.quantity) * Number(i.unit_price || 0)), 0); 
    // Correction: i.total_cost might be pre-calculated by backend, or we calc it. 
    // In 'selectRecipe' we fetch /api/recipes/:id. 
    // Let's assume the backend provides 'total_cost' or we calc it.
    // Looking at previous baseCost code: it used i.total_cost.
    // If i.total_cost is available use it, else calc.
});

const allVariantCalculations = computed(() => {
    if (!selectedRecipe.value || !selectedRecipe.value.variants) return [];
    
    return selectedRecipe.value.variants.map((v: any) => {
        // Calculate cost for this variant
        const cost = v.items ? v.items.reduce((sum: number, i: any) => sum + (Number(i.total_cost) || (Number(i.quantity) * Number(i.unit_price)) || 0), 0) : 0;
        
        const extraPrice = Number(v.extraPrice) || 0; 
        const finalPrice = Number(formData.price) + extraPrice;
        
        let margin = 0;
        if (finalPrice > 0) {
            margin = ((finalPrice - cost) / finalPrice) * 100;
        }
        
        return {
            name: v.name,
            cost,
            finalPrice,
            margin
        };
    });
});

const averageMargin = computed(() => {
    const vars = allVariantCalculations.value;
    if (vars.length === 0) return 0;
    // We only care about margin average for display? 
    // Or weighted? Simple average as requested.
    const total = vars.reduce((sum: number, v: any) => sum + v.margin, 0);
    return (total / vars.length).toFixed(0);
});

const formattedVariantCosts = computed(() => {
     return allVariantCalculations.value.map((v: any) => `$${v.cost.toFixed(2)}`).join(' | ');
});


// Variants Logic - Custom Groups
const customGroups = ref<any[]>([]);
const inventoryProducts = ref<string[]>([]);

const loadInventoryProducts = async () => {
    try {
        const response = await authFetch('/api/inventory/products');
        if (response.ok) {
            inventoryProducts.value = await response.json();
        }
    } catch (e) {
        console.error('Error loading inventory products:', e);
    }
};

const getFilteredInventory = (search: string) => {
    if (!search) return inventoryProducts.value.slice(0, 10);
    const lower = search.toLowerCase();
    return inventoryProducts.value.filter(p => p.toLowerCase().includes(lower)).slice(0, 10);
};

const handleInventorySearch = (groupIdx: number, optIdx: number) => {
    customGroups.value[groupIdx].options[optIdx].showInventorySuggestions = true;
};

const showInventoryDropdown = (groupIdx: number, optIdx: number) => {
    customGroups.value[groupIdx].options[optIdx].showInventorySuggestions = true;
};

const hideInventoryDropdown = (groupIdx: number, optIdx: number) => {
    setTimeout(() => {
        customGroups.value[groupIdx].options[optIdx].showInventorySuggestions = false;
    }, 200);
};

const selectInventoryProduct = (groupIdx: number, optIdx: number, product: string) => {
    customGroups.value[groupIdx].options[optIdx].inventoryProductName = product;
    customGroups.value[groupIdx].options[optIdx].inventorySearch = product;
    customGroups.value[groupIdx].options[optIdx].showInventorySuggestions = false;
};

const addCustomGroup = () => {
    customGroups.value.push({
        name: '',
        options: [{ 
            name: '', 
            extraPrice: 0, 
            inventoryProductName: '', 
            replacedIngredientName: '',
            inventorySearch: '', 
            showInventorySuggestions: false 
        }]
    });
};

const removeCustomGroup = (idx: number) => {
    customGroups.value.splice(idx, 1);
};

const addOptionToGroup = (groupIdx: number) => {
    customGroups.value[groupIdx].options.push({ 
        name: '', 
        extraPrice: 0, 
        inventoryProductName: '', 
        replacedIngredientName: '',
        inventorySearch: '', 
        showInventorySuggestions: false 
    });
};

const removeOptionFromGroup = (groupIdx: number, optIdx: number) => {
    customGroups.value[groupIdx].options.splice(optIdx, 1);
};

// Substitution Modal Logic
const substitutionModal = reactive({
    isOpen: false,
    groupIdx: -1,
    optIdx: -1,
    variantName: '',
    replacedIngredient: '',
    inventoryProduct: ''
});

const recipeIngredients = ref<string[]>([]);

const loadRecipeIngredients = async () => {
    if (!selectedRecipe.value || !selectedRecipe.value.variants || selectedRecipe.value.variants.length === 0) {
        recipeIngredients.value = [];
        return;
    }
    
    // Get ingredients from first variant
    const firstVariant = selectedRecipe.value.variants[0];
    if (firstVariant.items && Array.isArray(firstVariant.items)) {
        recipeIngredients.value = firstVariant.items.map((item: any) => item.product_name);
    }
};

const openSubstitutionModal = (groupIdx: number, optIdx: number) => {
    const option = customGroups.value[groupIdx].options[optIdx];
    substitutionModal.isOpen = true;
    substitutionModal.groupIdx = groupIdx;
    substitutionModal.optIdx = optIdx;
    substitutionModal.variantName = option.name || 'Nueva variación';
    substitutionModal.replacedIngredient = option.replacedIngredientName || '';
    substitutionModal.inventoryProduct = option.inventoryProductName || '';
};

const closeSubstitutionModal = () => {
    substitutionModal.isOpen = false;
};

const saveSubstitution = (data: { replacedIngredient: string; inventoryProduct: string }) => {
    const option = customGroups.value[substitutionModal.groupIdx].options[substitutionModal.optIdx];
    option.replacedIngredientName = data.replacedIngredient;
    option.inventoryProductName = data.inventoryProduct;
    option.inventorySearch = data.inventoryProduct;
    closeSubstitutionModal();
};


const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
        alert('Nombre y Categoría son obligatorios');
        return;
    }

    // Construct variants payload
    const allVariants = [];
    
    // 1. Add Recipe Variants (e.g. Size) if applicable
    if (selectedRecipe.value && selectedRecipe.value.variants && selectedRecipe.value.variants.length > 1) {
        allVariants.push({
            groupName: 'Tamaño',
            options: selectedRecipe.value.variants.map((v: any) => ({
                name: v.name,
                extraPrice: v.extraPrice,
                recipeVariantId: v.id
            }))
        });
    }

    // 2. Add Custom Groups
    customGroups.value.forEach(g => {
        if (g.name && g.options.length > 0) {
            allVariants.push({
                groupName: g.name,
                options: g.options.filter((o: any) => o.name).map((o: any) => ({
                    name: o.name,
                    extraPrice: o.extraPrice,
                    inventoryProductName: o.inventoryProductName,
                    replacedIngredientName: o.replacedIngredientName
                }))
            });
        }
    });

    const payload = {
        ...formData,
        icon: imagePreview.value, // Send base64 image string (or the existing url if unchanged, handled by backend)
        status: formData.isPublic ? 'active' : 'inactive',
        variantGroups: formData.type === 'variable' ? allVariants : []
    };

    try {
        const response = await authFetch(`/api/menu-items/${dishId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            router.push('/menu');
        } else {
            alert('Error al guardar cambios');
        }
    } catch (e) {
        console.error(e);
        alert('Error de conexión');
    }
};

onMounted(async () => {
    await loadRecipes();
    await loadInventoryProducts();

    // Fetch Dish Data for Edit
    if (dishId) {
        try {
            const res = await authFetch(`/api/menu-items/${dishId}`);
            if (res.ok) {
                const item = await res.json();
                
                // Populate Form
                formData.name = item.name;
                formData.description = item.description || '';
                formData.category = item.category;
                formData.type = item.type || 'simple';
                formData.price = Number(item.price);
                formData.isPublic = item.status === 'active';
                formData.recipeId = item.recipeId;
                
                // Populate Image
                if (item.icon) {
                    imagePreview.value = item.icon;
                }

                // Populate Recipe
                if (item.recipeId) {
                    const recipe = recipes.value.find(r => r.id === item.recipeId);
                    if (recipe) {
                        recipeSearch.value = recipe.name;
                        await selectRecipe(recipe); 
                    }
                }

                // Populate Variants (This is tricky because backend returns them flat or grouped)
                // The endpoint now returns 'variantGroups'
                if (item.variantGroups && Array.isArray(item.variantGroups)) {
                     const sizeGroup = item.variantGroups.find((g: any) => g.groupName === 'Tamaño');
                     
                     // If we have size group and recipe selected, map extra prices back
                     if (sizeGroup && selectedRecipe.value && selectedRecipe.value.variants) {
                         selectedRecipe.value.variants.forEach((rv: any) => {
                             const match = sizeGroup.options.find((opt: any) => opt.name === rv.name);
                             if (match) {
                                 rv.extraPrice = match.extraPrice;
                             }
                         });
                     }

                     // Load Custom Groups (Everything else)
                     const others = item.variantGroups.filter((g: any) => g.groupName !== 'Tamaño');
                     others.forEach((g: any) => {
                         customGroups.value.push({
                             name: g.groupName,
                             options: g.options.map((o: any) => ({
                                 name: o.name,
                                 extraPrice: o.extraPrice,
                                 inventoryProductName: o.inventoryProductName || '',
                                 replacedIngredientName: o.replacedIngredientName || '',
                                 inventorySearch: o.inventoryProductName || '',
                                 showInventorySuggestions: false
                             }))
                         });
                     });
                }
            } else {
                console.error('Failed to fetch dish:', res.statusText);
            }
        } catch (e) {
            console.error('Error loading dish:', e);
        }
    }
});

</script>
