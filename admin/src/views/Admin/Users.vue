<template>
  <AdminLayout>
    
    <div class="space-y-5 sm:space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Empleados</h2>
        <Button size="md" variant="primary" @click="handleAddNew" class="rounded-full">
           Nuevo Empleado
        </Button>
      </div>


      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Nombre</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Correo</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Usuario</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Rol</p>
                </th>
                 <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acciones</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="users.length === 0">
                <td colspan="5" class="px-5 py-8 text-center text-gray-500 text-sm">No hay empleados registrados</td>
              </tr>
              <tr v-for="(user, index) in users" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center">
                    <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                      {{ user.name }}
                    </span>
                  </div>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.email }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.username }}</p>
                </td>
                 <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ user.role }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="handleEdit(user.id)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Borrar" @click="handleDelete(user.id)">
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
import { useRouter } from 'vue-router';

import { ref, onMounted, computed } from 'vue';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Button from "@/components/ui/Button.vue";
import { PencilIcon, TrashIcon } from "@/icons";
import { authFetch } from '@/utils/api';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    role: string;
    image_url?: string;
}

const router = useRouter();

const users = ref<User[]>([]);

const fetchUsers = async () => {
    try {
        const response = await authFetch('/api/users');
        if (response.ok) {
            const data = await response.json();
            // Filtrar administradores para mostrar solo empleados
            users.value = data.filter((u: User) => u.role !== 'Administrador');
        }
    } catch (error) {
        console.error('Error fetching users:', error);
    }
};

const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado?')) return;
    try {
        const response = await authFetch(`/api/users/${id}`, {
            method: 'DELETE'
        });
        if (response.ok) {
            users.value = users.value.filter(u => u.id !== id);
        } else {
            alert('Error al eliminar empleado');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
};

onMounted(() => {
  fetchUsers();
});

const handleEdit = (id: number) => {
   router.push(`/users/${id}/edit`);
};

const handleAddNew = () => {
   router.push('/users/create');
};
</script>
