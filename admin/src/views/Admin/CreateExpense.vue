<template>
  <AdminLayout>
    <div class="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
      <h3 class="font-semibold text-lg text-gray-800 dark:text-white/90 mb-6">Nuevo Gasto</h3>
      <form @submit.prevent="handleSubmit">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          <!-- Concept -->
          <div class="col-span-12">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Concepto
            </label>
            <input
              type="text"
              v-model="formData.concept"
              placeholder="Descripción del gasto"
              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <!-- Paid To -->
          <div class="col-span-12 md:col-span-6">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Pagado A
            </label>
            <input
              type="text"
              v-model="formData.paidTo"
              placeholder="Nombre del beneficiario"
              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <!-- Date -->
          <div class="col-span-12 md:col-span-6">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Fecha
            </label>
             <input
              type="date"
              v-model="formData.date"
              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

           <!-- Amount -->
          <div class="col-span-12 md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Monto
            </label>
             <div class="relative">
                <span class="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">$</span>
                <input
                type="number"
                v-model="formData.amount"
                placeholder="0.00"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pl-10 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                step="0.01"
                />
            </div>
          </div>

           <!-- Payment Method -->
          <div class="col-span-12 md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Forma de Pago
            </label>
            <div class="relative z-20 bg-transparent">
              <select
                v-model="formData.paymentMethod"
                class="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              >
                <option value="" disabled selected>Seleccionar</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="CXP">CXP</option>
              </select>
               <span class="absolute z-30 text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="col-span-12 flex justify-end gap-3 mt-6">
            <Button size="md" variant="outline" @click="$router.back()">Cancelar</Button>
            <Button size="md" variant="primary" type="submit">Guardar Gasto</Button>
          </div>
        </div>
      </form>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import Button from '@/components/ui/Button.vue'
import { authFetch } from '@/utils/api'

const router = useRouter()

const formData = reactive({
  concept: '',
  paidTo: '',
  date: (() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  })(),
  amount: '',
  paymentMethod: '',
})

const handleSubmit = async () => {
    // Validation
    if (!formData.concept || !formData.paidTo || !formData.date || !formData.amount || !formData.paymentMethod) {
        alert('Por favor complete todos los campos requeridos.');
        return;
    }

    try {
        const response = await authFetch('/api/expenses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al guardar gasto');
        }
        
        // Success
        router.push('/expenses');
    } catch (error: any) {
        console.error('Error creating expense:', error);
        alert(error.message);
    }
}
</script>
