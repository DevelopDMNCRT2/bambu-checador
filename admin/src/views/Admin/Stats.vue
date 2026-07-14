<template>
  <AdminLayout>
    <div class="space-y-6">
      
      <!-- Date & Controls Header -->
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90 whitespace-nowrap">Estadísticas</h2>
        
        <div class="flex flex-row flex-wrap items-center gap-4">
          <!-- Filter Tabs -->
          <div class="flex p-1 bg-gray-100 rounded-lg dark:bg-gray-800 w-fit">
            <button 
                v-for="filter in dateFilters" 
                :key="filter.value"
                @click="setDateFilter(filter.value)"
                :class="[
                    'px-4 py-1.5 text-sm font-medium rounded-md transition-all',
                    activeDateFilter === filter.value 
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                ]"
            >
                {{ filter.label }}
            </button>
          </div>

          <!-- Date Pickers Row (conditional) -->
          <div v-if="activeDateFilter === 'month' || activeDateFilter === 'range'" class="flex items-center">
            <!-- Month Picker (for Mes filter) -->
          <div v-if="activeDateFilter === 'month'" class="relative group">
            <div class="h-[34px] min-w-[150px] flex items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:hover:bg-gray-800">
                <span class="font-medium">{{ formattedMonth }}</span>
                <ChevronDownIcon class="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-500 dark:group-hover:text-gray-300" />
            </div>
            <input 
                type="month" 
                v-model="selectedMonth"
                @change="fetchStats"
                class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
          </div>

          <!-- Range Picker (for Rango filter) -->
          <div v-if="activeDateFilter === 'range'" class="flex items-center gap-2">
              <input 
                  type="date" 
                  v-model="rangeStart"
                  @change="fetchStats"
                  class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
              <span class="text-gray-400">-</span>
              <input 
                  type="date" 
                  v-model="rangeEnd"
                  @change="fetchStats"
                  class="h-[34px] rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              />
          </div>
          </div>
        </div>
      </div>

      <!-- Overview Cards Grid -->
      <!-- Overview Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        
        <!-- Card 1: Ingresos Acumulados -->
        <div class="col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <div class="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                   <DollarSignIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos</h3>
            </div>
            
            <div class="mt-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.income) }}
                </span>
            </div>

            <!-- Removed percentage and description -->
        </div>

        <!-- Card 2: Egresos -->
        <div class="col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <div class="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                   <TrendingDownIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Egresos</h3>
            </div>
            
            <div class="mt-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.expenses) }}
                </span>
            </div>

            <!-- Removed percentage and description -->
        </div>

        <!-- Card 3: Balance -->
        <div class="col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-2 mb-3">
                <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                   <WalletIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Balance</h3>
            </div>
            
            <div class="mt-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.balance) }}
                </span>
            </div>

            <!-- Removed percentage and description -->
        </div>

        <!-- Card 4: CXC -->
        <div class="col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative">
            <div class="flex items-center gap-2 mb-3">
                <div class="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                   <WalletIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Cuentas por Cobrar (CXC)</h3>
            </div>
            
            <div class="mt-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.totalCXC) }}
                </span>
            </div>
        </div>

        <!-- Card 5: Cortesías -->
        <div class="col-span-1 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm relative">
            <div class="flex items-center gap-2 mb-3">
                <div class="p-1.5 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400">
                   <GiftIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Cortesías</h3>
            </div>
            
            <div class="mt-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(stats.courtesies) }}
                </span>
            </div>
        </div>

        <!-- Card 5: Top Selling Items (Full Width or split) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-5 xl:col-span-3 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                   <TrendingUpIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Top 5 Platillos Más Vendidos</h3>
            </div>
            
            <div v-if="stats.topSellingItems.length > 0" class="mt-4">
                <apexchart
                    type="bar"
                    height="200"
                    :options="topItemsChartOptions"
                    :series="topItemsChartSeries"
                ></apexchart>
            </div>
            <div v-else class="flex items-center justify-center h-40 text-gray-400 text-sm">
                No hay datos de ventas en este periodo
            </div>

            <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Ayuda a decisiones de menú, precios y enfoque comercial
            </p>
        </div>

        <!-- Card 6: Top Profitable Items (Full Width or split) -->
        <div class="col-span-1 md:col-span-2 lg:col-span-5 xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div class="flex items-center gap-2 mb-4">
                <div class="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                   <DollarSignIcon class="w-4 h-4" />
                </div>
                <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Top 5 Platillos Más Rentables</h3>
            </div>
            
            <div v-if="stats.topProfitableItems.length > 0" class="mt-4">
                <apexchart
                    type="bar"
                    height="200"
                    :options="topProfitableChartOptions"
                    :series="topProfitableChartSeries"
                ></apexchart>
            </div>
            <div v-else class="flex items-center justify-center h-40 text-gray-400 text-sm">
                No hay datos de ventas en este periodo
            </div>

            <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
                Guía decisiones estratégicas, no emocionales
            </p>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import AdminLayout from '@/components/layout/AdminLayout.vue';
import { DollarSignIcon, TrendingUpIcon, TrendingDownIcon, ChevronDownIcon, WalletIcon, GiftIcon } from 'lucide-vue-next';
import VueApexCharts from "vue3-apexcharts";

// Components for chart
const apexchart = VueApexCharts;

const stats = ref({
    netProfit: 0,
    prevNetProfit: 0,
    income: 0,
    prevIncome: 0,
    expenses: 0,
    prevExpenses: 0,
    balance: 0,
    prevBalance: 0,
    trend: [],
    totalCXC: 0,
    courtesies: 0,
    profitMargin: {
        current: 0,
        historical: 0
    },
    topSellingItems: [],
    topProfitableItems: []
});

const loading = ref(false);

// Date filter state
const dateFilters = [
    { label: 'Hoy', value: 'today' },
    { label: 'Rango', value: 'range' },
    { label: 'Mes', value: 'month' }
];

const activeDateFilter = ref('today');
const selectedMonth = ref(new Date().toISOString().slice(0, 7)); // YYYY-MM format
const rangeStart = ref(new Date().toISOString().split('T')[0]);
const rangeEnd = ref(new Date().toISOString().split('T')[0]);

const formattedMonth = computed(() => {
    if (!selectedMonth.value) return '';
    const [year, month] = selectedMonth.value.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const str = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date);
    return str.charAt(0).toUpperCase() + str.slice(1);
});

// Computed properties for charts removed

const topItemsChartSeries = computed(() => [{
    name: 'Cantidad Vendida',
    data: stats.value.topSellingItems.map(item => item.quantity)
}]);

const topItemsChartOptions = computed(() => ({
    chart: {
        type: 'bar',
        toolbar: { show: false },
        height: 200
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 4,
            distributed: true
        }
    },
    colors: ['#0EB325', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'],
    dataLabels: {
        enabled: true,
        style: {
            colors: ['#fff']
        }
    },
    xaxis: {
        categories: stats.value.topSellingItems.map(item => item.name),
        labels: {
            style: {
                colors: '#9CA3AF',
                fontSize: '12px'
            }
        }
    },
    yaxis: {
        labels: {
            style: {
                colors: '#9CA3AF',
                fontSize: '12px'
            }
        }
    },
    grid: {
        borderColor: '#374151',
        strokeDashArray: 4
    },
    tooltip: {
        theme: 'dark',
        y: {
            formatter: function (val) {
                return val + ' unidades';
            }
        }
    },
    legend: {
        show: false
    }
}));

const topProfitableChartSeries = computed(() => [{
    name: 'Utilidad Generada',
    data: stats.value.topProfitableItems.map(item => item.profit)
}]);

const topProfitableChartOptions = computed(() => ({
    chart: {
        type: 'bar',
        toolbar: { show: false },
        height: 200
    },
    plotOptions: {
        bar: {
            horizontal: true,
            borderRadius: 4,
            distributed: true
        }
    },
    colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'],
    dataLabels: {
        enabled: true,
        formatter: function (val) {
            return '$' + val.toFixed(0);
        },
        style: {
            colors: ['#fff']
        }
    },
    xaxis: {
        categories: stats.value.topProfitableItems.map(item => item.name),
        labels: {
            style: {
                colors: '#9CA3AF',
                fontSize: '12px'
            }
        }
    },
    yaxis: {
        labels: {
            style: {
                colors: '#9CA3AF',
                fontSize: '12px'
            }
        }
    },
    grid: {
        borderColor: '#374151',
        strokeDashArray: 4
    },
    tooltip: {
        theme: 'dark',
        y: {
            formatter: function (val) {
                return '$' + val.toFixed(2);
            }
        }
    },
    legend: {
        show: false
    }
}));

// Helper functions removed

const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
};

const setDateFilter = (filter) => {
    activeDateFilter.value = filter;
    fetchStats();
};

import { authFetch } from '@/utils/api';

// ... (existing imports match top of script)

// ...

const fetchStats = async () => {
    loading.value = true;
    try {
        let startDate, endDate;
        
        // Calculate dates based on active filter
        if (activeDateFilter.value === 'today') {
            const today = new Date().toISOString().split('T')[0];
            startDate = today;
            endDate = today;
        } else if (activeDateFilter.value === 'range') {
            startDate = rangeStart.value;
            endDate = rangeEnd.value;
        } else if (activeDateFilter.value === 'month') {
            // selectedMonth is in YYYY-MM format
            const [year, month] = selectedMonth.value.split('-');
            const firstDay = new Date(year, month - 1, 1);
            const lastDay = new Date(year, month, 0);
            startDate = firstDay.toISOString().split('T')[0];
            endDate = lastDay.toISOString().split('T')[0];
        }
        
        const params = new URLSearchParams({ startDate, endDate });
        const res = await authFetch(`/api/reports/dashboard-stats?${params}`);
        if (res.ok) {
            stats.value = await res.json();
        }
    } catch (e) {
        console.error(e);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchStats();
});
</script>
