<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Recetas</h2>
        </div>
        <Button variant="primary" size="sm" @click="$router.push('/recipes/create')">
          Nueva Receta
        </Button>
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
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Categoría</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Costo Real</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha de Alta</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="paginatedRecipes.length === 0">
                <td colspan="5" class="px-5 py-8 text-center text-gray-500 text-sm">No hay recetas registradas</td>
              </tr>
              <tr v-for="recipe in paginatedRecipes" :key="recipe.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ recipe.name }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ recipe.category }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ formatCost(recipe) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ recipe.date }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="$router.push(`/recipes/${recipe.id}/edit`)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Eliminar" @click="handleDelete(recipe.id)">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
         <!-- Pagination Controls -->
         <div class="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800" v-if="recipes.length > itemsPerPage">
             <div class="text-sm text-gray-500">
                 Mostrando {{ startIndex + 1 }} a {{ Math.min(endIndex, recipes.length) }} de {{ recipes.length }} resultados
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
import { authFetch } from '@/utils/api';

const router = useRouter();
const recipes = ref<any[]>([]);
const currentPage = ref(1);
const itemsPerPage = 10;

const fetchRecipes = async () => {
    try {
        const response = await authFetch('/api/recipes');
        if (response.ok) {
            recipes.value = await response.json();
        }
    } catch (error) {
        console.error('Error fetching recipes:', error);
    }
};

const deleteRecipe = async (id: number) => {
    if (!confirm('¿Eliminar receta?')) return;
    try {
        await authFetch(`/api/recipes/${id}`, { method: 'DELETE' });
        fetchRecipes();
    } catch (e) { console.error(e); }
};

const handleDelete = async (id: number) => {
    deleteRecipe(id);
}

const formatCost = (recipe: any) => {
    const min = Number(recipe.min_cost);
    const max = Number(recipe.max_cost);
    
    if (!isNaN(min) && !isNaN(max) && min !== max) {
        return `$${min.toFixed(2)} - $${max.toFixed(2)}`;
    }
    return `$${(isNaN(min) ? 0 : min).toFixed(2)}`;
};

// Pagination Logic
const totalPages = computed(() => Math.ceil(recipes.value.length / itemsPerPage));
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage);
const endIndex = computed(() => currentPage.value * itemsPerPage);
const paginatedRecipes = computed(() => {
    return recipes.value.slice(startIndex.value, endIndex.value);
});

onMounted(() => {
  fetchRecipes();
});
</script>
