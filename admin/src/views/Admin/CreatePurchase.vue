<template>
  <AdminLayout>
    <div class="p-6">
      <div class="mb-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Nuevo Ticket
          </h1>
        </div>
        <Button variant="outline" @click="$router.back()">Volver</Button>
      </div>

      <!-- Error State -->
      <div v-if="apiError" class="mb-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 p-4 text-red-600 dark:text-red-400">
        {{ apiError }}
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Factura / Ticket</label>
            <input type="text" v-model="formData.ticketNumber" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" placeholder="Ej: F-10293" />
          </div>
          
          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Fecha de Compra</label>
            <input type="date" v-model="formData.date" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" />
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Proveedor</label>
            <input type="text" v-model="formData.provider" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" placeholder="Ej: Distribuidora del Centro" />
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Forma de Pago</label>
            <div class="relative">
              <select v-model="formData.paymentMethod" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 appearance-none">
                <option value="" disabled>Seleccionar</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="CXP">CXP</option>
              </select>
              <span class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-4 top-1/2 dark:text-gray-400">
                <svg class="stroke-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4.79175 7.396L10.0001 12.6043L15.2084 7.396" stroke="" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        <!-- Detalle de la factura -->
        <div class="mt-8">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-800 dark:text-white/90">Detalle de Factura</h3>
            <button @click="addItemRow" type="button" class="text-sm font-medium text-brand-500 hover:text-brand-600 transition-colors flex items-center gap-1">
              + Agregar concepto
            </button>
          </div>
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th class="px-5 py-3 text-left w-[120px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Cantidad</p></th>
                    <th class="px-5 py-3 text-left w-[120px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Medida</p></th>
                    <th class="px-5 py-3 text-left"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Producto</p></th>
                    <th class="px-5 py-3 text-left w-[120px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tipo Costo</p></th>
                    <th class="px-5 py-3 text-right w-[150px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Precio Unitario</p></th>
                    <th class="px-5 py-3 text-right w-[150px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Descuento</p></th>
                    <th class="px-5 py-3 text-right w-[150px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p></th>
                    <th class="px-4 py-3 text-center w-[60px]"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Acción</p></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-if="!formData.items.length">
                    <td colspan="8" class="px-5 py-8 text-center text-gray-400 dark:text-gray-500">
                      No hay conceptos añadidos. Agrega uno usando el botón superior.
                    </td>
                  </tr>
                  <tr v-for="(item, index) in formData.items" :key="index" class="border-t border-gray-100 dark:border-gray-800">
                    <td class="px-3 py-4">
                      <input type="number" v-model.number="item.cantidad" min="1" step="any" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 appearance-none" />
                    </td>
                    <td class="px-3 py-4">
                      <select v-model="item.medida" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 appearance-none min-w-[80px]">
                        <option value="Kg">Kg</option>
                        <option value="Gr">Gr</option>
                        <option value="Lt">Lt</option>
                        <option value="Ml">Ml</option>
                        <option value="Pzas">Pzas</option>
                      </select>
                    </td>
                    <td class="px-3 py-4">
                      <input type="text" v-model="item.producto" class="w-full min-w-[150px] rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" />
                    </td>
                    <td class="px-3 py-4">
                      <select v-model="item.costType" class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800 appearance-none min-w-[90px]">
                        <option value="Directo">Directo</option>
                        <option value="Indirecto">Indirecto</option>
                      </select>
                    </td>
                    <td class="px-3 py-4 text-right">
                      <input type="number" v-model.number="item.precioUnitario" step="0.01" min="0" class="w-full min-w-[100px] text-right rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" />
                    </td>
                    <td class="px-3 py-4 text-right">
                      <input type="number" v-model.number="item.descuento" step="0.01" min="0" class="w-full min-w-[100px] text-right rounded-lg border border-gray-300 bg-transparent px-3 py-1.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800" />
                    </td>
                    <td class="px-3 py-4 text-right">
                      <p class="text-gray-800 font-medium text-theme-sm dark:text-white/90">{{ formatCurrency((item.cantidad * item.precioUnitario) - item.descuento) }}</p>
                    </td>
                    <td class="px-4 py-4 text-center">
                      <button @click="removeItemRow(index)" type="button" class="text-gray-400 hover:text-error-500 transition-colors" title="Eliminar fila">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Resumen de totales -->
            <div class="flex justify-end border-t border-gray-200 p-5 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/20">
              <div class="w-full max-w-xs space-y-3">
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">SUBTOTAL</span>
                  <span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(calculatedSubtotal) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm font-medium text-gray-500 dark:text-gray-400">IVA (16%)</span>
                  <span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(calculatedIva) }}</span>
                </div>
                <div class="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span class="text-base font-medium text-gray-800 dark:text-white/90">Total</span>
                  <span class="text-lg font-bold text-brand-500">{{ formatCurrency(calculatedGranTotal) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-3">
          <Button variant="outline" @click="$router.back()">Cancelar</Button>
          <Button @click="saveCompra" :disabled="saving">
            <span v-if="saving">Guardando...</span>
            <span v-else>Guardar</span>
          </Button>
        </div>
      </div>
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
const saving = ref(false);
const apiError = ref('');

const formData = reactive({
  ticketNumber: '',
  date: new Date().toISOString().split('T')[0],
  provider: '',
  paymentMethod: 'Efectivo',
  items: [] as any[]
});

const calculatedSubtotal = computed(() => {
  return formData.items.reduce((acc, item) => {
    const qty = Number(item.cantidad) || 0;
    const price = Number(item.precioUnitario) || 0;
    const discount = Number(item.descuento) || 0;
    return acc + ((qty * price) - discount);
  }, 0);
});

const calculatedIva = computed(() => {
  return calculatedSubtotal.value * 0.16;
});

const calculatedGranTotal = computed(() => {
  return calculatedSubtotal.value + calculatedIva.value;
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(value);
};

const addItemRow = () => {
  formData.items.push({
    cantidad: 1,
    medida: 'Pzas',
    producto: '',
    costType: 'Directo',
    precioUnitario: 0,
    descuento: 0
  });
};

const removeItemRow = (index: number) => {
  formData.items.splice(index, 1);
};

// Start with one empty row
addItemRow();

const saveCompra = async () => {
  apiError.value = '';

  if (!formData.ticketNumber || !formData.date || !formData.provider || !formData.paymentMethod) {
    apiError.value = 'Factura, fecha, proveedor y forma de pago son campos obligatorios.';
    return;
  }

  if (formData.items.length === 0) {
    apiError.value = 'Debes añadir al menos un concepto en el detalle de la factura.';
    return;
  }

  for (const item of formData.items) {
    if (!item.producto.trim()) {
      apiError.value = 'Todos los conceptos deben tener un nombre de producto válido.';
      return;
    }
    if (item.cantidad <= 0 || item.precioUnitario < 0) {
      apiError.value = 'La cantidad debe ser mayor que 0 y el precio unitario no puede ser negativo.';
      return;
    }
  }

  saving.value = true;
  try {
    const payload = {
      ticketNumber: formData.ticketNumber,
      provider: formData.provider,
      date: formData.date,
      paymentMethod: formData.paymentMethod,
      total: calculatedGranTotal.value,
      items: formData.items
    };

    const response = await authFetch('/api/purchases', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al guardar la compra');
    }
    
    router.push('/purchases');
  } catch (e: any) {
    apiError.value = e.message || 'Error al guardar la compra';
  } finally {
    saving.value = false;
  }
};
</script>
