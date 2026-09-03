<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">
      
      <!-- Header: Title & Actions -->
      <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Compras y Gastos</h2>
        </div>
        
        <div class="flex flex-wrap items-center gap-3">
          <!-- View Toggle -->
          <div class="bg-slate-100 dark:bg-gray-800 p-1 rounded-xl inline-flex items-center border border-gray-200 dark:border-gray-700">
             <button 
              @click="viewMode = 'tickets'" 
              :class="viewMode === 'tickets' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none flex items-center gap-2"
            >
              Tickets
            </button>
            <button 
              @click="viewMode = 'summary'" 
              :class="viewMode === 'summary' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none flex items-center gap-2"
            >
              Totalización
            </button>
            <button 
              @click="viewMode = 'accumulated'" 
              :class="viewMode === 'accumulated' ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none flex items-center gap-2"
            >
              Conceptos
            </button>
          </div>

          <!-- Search (only for tickets) -->
          <div v-if="viewMode === 'tickets'" class="relative w-full sm:w-64">
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar factura..." 
              class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white"
            />
            <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <!-- Filter Tabs -->
          <div class="bg-slate-100 dark:bg-gray-800 p-1 rounded-xl inline-flex items-center">
            <button 
              @click="activeFilter = 'today'" 
              :class="activeFilter === 'today' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Hoy
            </button>
            <button 
              v-if="viewMode === 'tickets'"
              @click="activeFilter = 'no_breakdown'" 
              :class="activeFilter === 'no_breakdown' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Sin Desglose
            </button>
            <button 
              @click="activeFilter = 'day'" 
              :class="activeFilter === 'day' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Día
            </button>
             <button 
              @click="activeFilter = 'month'" 
              :class="activeFilter === 'month' ? 'bg-white dark:bg-gray-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200'"
              class="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 select-none"
            >
              Mes
            </button>
          </div>

          <!-- Date/Month Picker -->
          <div class="relative w-40">
            <input
              v-if="activeFilter === 'day'"
              type="date"
              v-model="selectedDate"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white cursor-pointer text-center shadow-sm"
            />
            <input
              v-else-if="activeFilter === 'month'"
              type="month"
              v-model="selectedMonth"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-white cursor-pointer text-center shadow-sm"
            />
            <input
               v-else
              type="text"
              disabled
              placeholder="-"
              class="w-full px-4 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm font-semibold focus:outline-none text-gray-400 dark:text-gray-500 cursor-not-allowed text-center shadow-sm"
            />
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 ml-auto xl:ml-0">
            <Button size="md" variant="outline" @click="exportPurchasesPDF" class="rounded-full flex items-center gap-1.5 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
               📄 Exportar PDF
            </Button>
            <Button size="md" variant="outline" :startIcon="UploadIcon" @click="isXMLModalOpen = true" class="rounded-full flex items-center gap-1.5">
               XML
            </Button>
            <Button size="md" variant="primary" @click="handleAddNew" class="rounded-full">
               Nuevo Ticket
            </Button>
          </div>
        </div>
      </div>

      <!-- Tickets Table Container -->
      <div v-if="viewMode === 'tickets'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Ticket</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Proveedor</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Fecha de Compra</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                   <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Forma de Pago</p>
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
              <tr v-if="filteredPurchases.length === 0">
                <td colspan="7" class="px-5 py-8 text-center text-gray-500 text-sm">No hay compras registradas en este periodo</td>
              </tr>
              <tr v-for="(purchase, index) in filteredPurchases" :key="index" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-5 py-4 sm:px-6">
                  <span class="text-gray-500 text-theme-sm dark:text-gray-400">#{{ purchase.ticketNumber }}</span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ purchase.provider }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ purchase.date }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="font-semibold text-gray-700 text-theme-sm dark:text-gray-200">${{ purchase.total }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ purchase.paymentMethod }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                    <span
                    :class="[
                      'rounded-full px-2 py-0.5 text-theme-xs font-medium',
                      {
                        'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500':
                          purchase.status === 'Desglosado',
                        'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400':
                          purchase.status === 'Sin Desglose',
                      },
                    ]"
                  >
                    {{ purchase.status }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                  <div class="flex items-center gap-2">
                    <button class="text-gray-500 hover:text-success-600 dark:text-gray-400 dark:hover:text-success-400" title="Desglosar" @click="handleBreakdown(purchase.id)">
                      <DollarIcon class="w-5 h-5" />
                    </button>
                    <button class="text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400" title="Editar" @click="handleEdit(purchase.id)">
                      <PencilIcon />
                    </button>
                    <button class="text-gray-500 hover:text-error-500 dark:text-gray-400 dark:hover:text-error-400" title="Borrar" @click="handleDelete(purchase.id)">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Totalización / Summary View -->
      <div v-if="viewMode === 'summary'" class="space-y-6">
        <!-- Tarjetas de Métricas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total Invertido</p>
              <h3 class="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-1">${{ summaryData.metrics.totalSpent.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</h3>
            </div>
            <div class="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 flex items-center justify-center">
              <DollarIcon class="w-6 h-6" />
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Total de Compras</p>
              <h3 class="text-2xl font-bold text-gray-800 dark:text-white mt-1">{{ summaryData.metrics.totalPurchases }} tickets</h3>
            </div>
            <div class="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ticket Promedio</p>
              <h3 class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">${{ summaryData.metrics.averageTicket.toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</h3>
            </div>
            <div class="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500 flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <!-- Tablas de Segmentación: Forma de Pago y Proveedor -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Desglose por Forma de Pago -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white mb-4">Totalización por Forma de Pago</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">
                    <th class="py-2.5 px-3">Forma de Pago</th>
                    <th class="py-2.5 px-3 text-center">Compras</th>
                    <th class="py-2.5 px-3 text-right">Monto Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <tr v-if="summaryData.byPaymentMethod.length === 0">
                    <td colspan="3" class="py-4 text-center text-gray-400">Sin datos de compras</td>
                  </tr>
                  <tr v-for="(pm, idx) in summaryData.byPaymentMethod" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="py-3 px-3 font-medium text-gray-800 dark:text-white">
                      <span class="inline-block w-2.5 h-2.5 rounded-full mr-2" :class="idx % 2 === 0 ? 'bg-brand-500' : 'bg-emerald-500'"></span>
                      {{ pm.paymentMethod }}
                    </td>
                    <td class="py-3 px-3 text-center text-gray-500 dark:text-gray-400 font-semibold">{{ pm.count }}</td>
                    <td class="py-3 px-3 text-right font-bold text-gray-800 dark:text-white">${{ Number(pm.total).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Desglose por Proveedor -->
          <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm">
            <h3 class="text-base font-semibold text-gray-800 dark:text-white mb-4">Totalización por Proveedor</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full">
                <thead>
                  <tr class="border-b border-gray-100 dark:border-gray-700 text-left text-xs font-semibold text-gray-400 uppercase">
                    <th class="py-2.5 px-3">Proveedor</th>
                    <th class="py-2.5 px-3 text-center">Compras</th>
                    <th class="py-2.5 px-3 text-right">Monto Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <tr v-if="summaryData.byProvider.length === 0">
                    <td colspan="3" class="py-4 text-center text-gray-400">Sin datos de proveedores</td>
                  </tr>
                  <tr v-for="(prov, idx) in summaryData.byProvider" :key="idx" class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td class="py-3 px-3 font-medium text-gray-800 dark:text-white">{{ prov.provider }}</td>
                    <td class="py-3 px-3 text-center text-gray-500 dark:text-gray-400 font-semibold">{{ prov.count }}</td>
                    <td class="py-3 px-3 text-right font-bold text-brand-600 dark:text-brand-400">${{ Number(prov.total).toLocaleString('es-MX', { minimumFractionDigits: 2 }) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

       <!-- Accumulated Table Container -->
      <div v-if="viewMode === 'accumulated'" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-w-full overflow-x-auto custom-scrollbar">
          <table class="min-w-full">
            <thead>
              <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Producto (Insumo)</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Cantidad Total</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Precio Promedio</p>
                </th>
                <th class="px-5 py-3 text-left sm:px-6">
                  <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Costo Invertido</p>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="accumulatedItems.length === 0">
                <td colspan="4" class="px-5 py-12 text-center text-gray-500 text-sm">
                   <div class="flex flex-col items-center justify-center">
                        <DollarIcon class="w-8 h-8 text-gray-300 dark:text-gray-600 mb-2" />
                        No hay insumos acumulados en este periodo
                   </div>
                </td>
              </tr>
              <tr v-for="(item, index) in accumulatedItems" :key="index" class="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td class="px-5 py-4 sm:px-6">
                  <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                    {{ item.product_name }}
                  </span>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-600 font-medium text-theme-sm dark:text-gray-300">
                      {{ Number(item.total_quantity).toFixed(2) }} <span class="text-gray-400 text-xs">{{ item.unit }}</span>
                    </p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="text-gray-600 text-theme-sm dark:text-gray-300">${{ Number(item.avg_price).toFixed(2) }}</p>
                </td>
                <td class="px-5 py-4 sm:px-6">
                   <p class="font-bold text-brand-600 text-theme-sm dark:text-brand-400">${{ Number(item.total_spent).toFixed(2) }}</p>
                </td>
              </tr>
            </tbody>
            <tfoot v-if="accumulatedItems.length > 0">
                <tr class="bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700">
                    <td colspan="3" class="px-5 py-4 sm:px-6 text-right font-semibold text-gray-700 dark:text-gray-200 text-sm">
                        Total Invertido en el periodo:
                    </td>
                    <td class="px-5 py-4 sm:px-6 font-bold text-brand-600 dark:text-brand-400 text-lg">
                        ${{ accumulatedTotal.toFixed(2) }}
                    </td>
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
    
    <ImportXMLModal 
      v-if="isXMLModalOpen" 
      @cancel="isXMLModalOpen = false" 
      @imported="handleXMLImported" 
    />
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from 'vue-router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AdminLayout from "@/components/layout/AdminLayout.vue";
import { authFetch } from '@/utils/api';
import Button from "@/components/ui/Button.vue";
import { PencilIcon, TrashIcon, DollarIcon, UploadIcon } from "@/icons";
import ImportXMLModal from "./ImportXMLModal.vue";

const router = useRouter();
const isXMLModalOpen = ref(false);
const searchQuery = ref('');

// State
const viewMode = ref<'tickets' | 'summary' | 'accumulated'>('tickets');
const activeFilter = ref('today');
const selectedDate = ref(new Date().toLocaleDateString('en-CA'));
const selectedMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM

const purchases = ref<any[]>([]);
const accumulatedItems = ref<any[]>([]);
const summaryData = ref<{
    metrics: { totalPurchases: number; totalSpent: number; averageTicket: number };
    byPaymentMethod: Array<{ paymentMethod: string; count: number; total: number }>;
    byProvider: Array<{ provider: string; count: number; total: number }>;
}>({
    metrics: { totalPurchases: 0, totalSpent: 0, averageTicket: 0 },
    byPaymentMethod: [],
    byProvider: []
});

const fetchSummary = async () => {
    let startDate = '';
    let endDate = '';

    if (activeFilter.value === 'today') {
        const today = getTodayString();
        startDate = today;
        endDate = today;
    } else if (activeFilter.value === 'day') {
        startDate = selectedDate.value;
        endDate = selectedDate.value;
    } else if (activeFilter.value === 'month' && selectedMonth.value) {
        const [year, month] = selectedMonth.value.split('-');
        const firstDay = new Date(Number(year), Number(month) - 1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);
        
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        startDate = `${yearStart}-${monthStart}-01`;
        
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        endDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
    }

    try {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        const response = await authFetch(`/api/purchases/summary?${params}`);
        if (response.ok) {
            summaryData.value = await response.json();
        }
    } catch (error) {
        console.error('Error fetching purchase summary:', error);
    }
};

// Fetch Accumulated Data
const fetchAccumulated = async () => {
    let startDate = '';
    let endDate = '';

    if (activeFilter.value === 'today') {
        const today = getTodayString();
        startDate = today;
        endDate = today;
    } else if (activeFilter.value === 'day') {
        startDate = selectedDate.value;
        endDate = selectedDate.value;
    } else if (activeFilter.value === 'month' && selectedMonth.value) {
        const [year, month] = selectedMonth.value.split('-');
        const firstDay = new Date(Number(year), Number(month) - 1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);
        
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        startDate = `${yearStart}-${monthStart}-01`;
        
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        endDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
    } else {
        const [year, month] = selectedMonth.value.split('-');
        const firstDay = new Date(Number(year), Number(month) - 1, 1);
        const lastDay = new Date(Number(year), Number(month), 0);
        
        const yearStart = firstDay.getFullYear();
        const monthStart = String(firstDay.getMonth() + 1).padStart(2, '0');
        startDate = `${yearStart}-${monthStart}-01`;
        
        const yearEnd = lastDay.getFullYear();
        const monthEnd = String(lastDay.getMonth() + 1).padStart(2, '0');
        const dayEnd = String(lastDay.getDate()).padStart(2, '0');
        endDate = `${yearEnd}-${monthEnd}-${dayEnd}`;
    }

    try {
        const params = new URLSearchParams();
        if (startDate && endDate) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
        }
        
        const response = await authFetch(`/api/purchases/accumulated?${params}`);
        if (response.ok) {
            const data = await response.json();
            accumulatedItems.value = data;
        }
    } catch (error) {
        console.error('Error fetching accumulated purchases:', error);
    }
};

const accumulatedTotal = computed(() => {
    return accumulatedItems.value.reduce((sum, item) => sum + Number(item.total_spent || 0), 0);
});

// Fetch Tickets Data
const fetchPurchases = async () => {
  try {
    const response = await authFetch('/api/purchases');
    if (response.ok) {
      const data = await response.json();
      purchases.value = data;
    }
  } catch (error) {
    console.error('Error fetching purchases:', error);
  }
};

const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const handleXMLImported = () => {
  isXMLModalOpen.value = false;
  fetchData();
};

const fetchData = () => {
    if (viewMode.value === 'tickets') {
        fetchPurchases();
    } else if (viewMode.value === 'summary') {
        fetchSummary();
    } else {
        fetchAccumulated();
    }
};

// Watchers to trigger refetch
watch(viewMode, () => {
    fetchData();
});

watch([activeFilter, selectedDate, selectedMonth], () => {
    if (viewMode.value === 'summary') {
        fetchSummary();
    } else if (viewMode.value === 'accumulated') {
        fetchAccumulated();
    }
});

const filteredPurchases = computed(() => {
    return purchases.value.filter(p => {
        const matchesSearch = !searchQuery.value || 
            (p.ticketNumber && p.ticketNumber.toLowerCase().includes(searchQuery.value.toLowerCase())) ||
            (p.provider && p.provider.toLowerCase().includes(searchQuery.value.toLowerCase()));
            
        let matchesDate = true;
        if (activeFilter.value === 'today') {
            const today = getTodayString();
            matchesDate = p.date === today;
        } else if (activeFilter.value === 'no_breakdown') {
            matchesDate = p.status === 'Sin Desglose';
        } else if (activeFilter.value === 'day') {
            matchesDate = !selectedDate.value || p.date === selectedDate.value;
        } else if (activeFilter.value === 'month') {
            matchesDate = !selectedMonth.value || p.date.startsWith(selectedMonth.value);
        }
        
        return matchesSearch && matchesDate;
    });
});

const handleDelete = async (id: number) => {
    if(!confirm('¿Estás seguro de eliminar esta compra?')) return;
    try {
        const response = await authFetch(`/api/purchases/${id}`, {
            method: 'DELETE'
        });
        if(response.ok) {
            fetchPurchases();
        } else {
            alert('Error al eliminar ticket');
        }
    } catch (error) {
        console.error('Error deleting purchase:', error);
    }
};

onMounted(() => {
  fetchData();
});

const handleEdit = (id: number) => {
   router.push(`/purchases/${id}/edit`);
};

const handleBreakdown = (id: number) => {
    router.push(`/purchases/${id}/breakdown`);
};

const handleAddNew = () => {
   router.push('/purchases/create');
};

const exportPurchasesPDF = async () => {
    try {
        let periodName = selectedMonth.value || new Date().toISOString().slice(0, 7);
        if (activeFilter.value === 'today') {
            periodName = getTodayString();
        } else if (activeFilter.value === 'day') {
            periodName = selectedDate.value;
        }

        // Ensure summary and accumulated data are fetched for report
        await fetchSummary();
        await fetchAccumulated();

        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        const brandColor: [number, number, number] = [5, 150, 105]; // Emerald 600 #059669
        const secondaryColor: [number, number, number] = [31, 41, 55];

        // Page Header (Branding)
        doc.setFillColor(brandColor[0], brandColor[1], brandColor[2]);
        doc.rect(0, 0, 210, 24, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('BAMBÚ ASISTENTE', 14, 11);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('REPORTE MENSUAL DE COMPRAS Y GASTOS', 14, 18);

        // Meta box (Top Right)
        doc.setFontSize(8);
        doc.text(`Período: ${periodName}`, 196, 9, { align: 'right' });
        doc.text(`Emisión: ${new Date().toLocaleDateString('es-MX')}`, 196, 14, { align: 'right' });
        doc.text(`Moneda: MXN ($)`, 196, 19, { align: 'right' });

        let currentY = 32;

        // Executive Summary KPI Cards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('1. Resumen Ejecutivo Financiero', 14, currentY);

        currentY += 5;
        const cardWidth = 58;
        const cardHeight = 18;

        // Card 1: Total Invertido
        doc.setFillColor(240, 253, 244);
        doc.setDrawColor(187, 247, 208);
        doc.roundedRect(14, currentY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(22, 101, 52);
        doc.text('TOTAL INVERTIDO', 18, currentY + 6);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${(summaryData.value.metrics.totalSpent || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 18, currentY + 14);

        // Card 2: Total de Compras
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(76, currentY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text('TOTAL DE COMPRAS', 80, currentY + 6);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${summaryData.value.metrics.totalPurchases || 0} tickets`, 80, currentY + 14);

        // Card 3: Ticket Promedio
        doc.setFillColor(245, 243, 255);
        doc.setDrawColor(221, 214, 254);
        doc.roundedRect(138, currentY, cardWidth, cardHeight, 2, 2, 'FD');
        doc.setFontSize(8);
        doc.setTextColor(91, 33, 182);
        doc.text('TICKET PROMEDIO', 142, currentY + 6);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`$${(summaryData.value.metrics.averageTicket || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 142, currentY + 14);

        currentY += cardHeight + 10;

        const totalSpent = summaryData.value.metrics.totalSpent || 1;

        // Section 2: Totalización por Forma de Pago
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('2. Totalización por Forma de Pago', 14, currentY);

        currentY += 4;

        const pmRows = summaryData.value.byPaymentMethod.map(r => [
            r.paymentMethod,
            r.count.toString(),
            `$${Number(r.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            `${((Number(r.total) / totalSpent) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Forma de Pago', 'Compras', 'Total Invertido', '% Total']],
            body: pmRows.length > 0 ? pmRows : [['Sin datos', '0', '$0.00', '0%']],
            headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8.5, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 45, halign: 'right' },
                3: { cellWidth: 25, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        // Section 3: Totalización por Proveedor
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('3. Totalización por Proveedor', 14, currentY);

        currentY += 4;

        const provRows = summaryData.value.byProvider.map(r => [
            r.provider,
            r.count.toString(),
            `$${Number(r.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
            `${((Number(r.total) / totalSpent) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Proveedor', 'Compras', 'Total Invertido', '% Total']],
            body: provRows.length > 0 ? provRows : [['Sin datos', '0', '$0.00', '0%']],
            headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 8.5, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 70 },
                1: { cellWidth: 25, halign: 'center' },
                2: { cellWidth: 50, halign: 'right' },
                3: { cellWidth: 35, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        // Section 4: Insumos y Conceptos Acumulados
        if (accumulatedItems.value.length > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            doc.text('4. Principales Insumos Comprados en el Mes', 14, currentY);

            currentY += 4;

            const accumulatedRows = accumulatedItems.value.slice(0, 15).map(r => [
                r.product_name,
                `${Number(r.total_quantity).toFixed(2)} ${r.unit}`,
                `$${Number(r.avg_price).toFixed(2)}`,
                `$${Number(r.total_spent).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Producto / Insumo', 'Cantidad Total', 'Precio Promedio', 'Total Invertido']],
                body: accumulatedRows,
                headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 8, cellPadding: 2 },
                columnStyles: {
                    0: { cellWidth: 75 },
                    1: { cellWidth: 35, halign: 'center' },
                    2: { cellWidth: 35, halign: 'right' },
                    3: { cellWidth: 35, halign: 'right' }
                },
                margin: { left: 14, right: 14 }
            });

            currentY = (doc as any).lastAutoTable.finalY + 8;
        }

        if (currentY > 220) {
            doc.addPage();
            currentY = 20;
        }

        // Section 5: Desglose Completo de Compras
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('5. Desglose Detallado de Tickets y Facturas del Mes', 14, currentY);

        currentY += 4;

        const purchaseRows = filteredPurchases.value.map(p => [
            `#${p.ticketNumber}`,
            p.provider,
            p.date,
            p.paymentMethod,
            p.hasIva ? 'Con IVA' : 'Sin IVA',
            p.status,
            `$${Number(p.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Ticket', 'Proveedor', 'Fecha', 'Forma Pago', 'IVA', 'Estado', 'Importe']],
            body: purchaseRows.length > 0 ? purchaseRows : [['-', 'Sin compras', '-', '-', '-', '-', '$0.00']],
            headStyles: { fillColor: brandColor, textColor: 255, fontStyle: 'bold' },
            styles: { fontSize: 7.5, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 25 },
                1: { cellWidth: 45 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth: 25 },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 22, halign: 'center' },
                6: { cellWidth: 20, halign: 'right' }
            },
            margin: { left: 14, right: 14 }
        });

        // Add footers
        const totalPages = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(156, 163, 175);
            doc.text(`Página ${i} de ${totalPages}`, 196, 290, { align: 'right' });
            doc.text('Bambú Asistente | Sistema de Control Operativo y Financiero - Documento Confidencial', 14, 290);
        }

        doc.save(`reporte_compras_Bambu_${periodName}.pdf`);
    } catch (error) {
        console.error('Error al exportar PDF de compras:', error);
        alert('Error al generar el reporte PDF');
    }
};
</script>
