<template>
  <AdminLayout>
    <div class="space-y-5 sm:space-y-6">

      <!-- Tabs Switcher -->
      <div class="flex border-b border-gray-200 dark:border-gray-700">
        <button
          @click="activeTab = 'diario'"
          :class="['px-5 py-3 font-semibold text-sm border-b-2 transition-all -mb-px', activeTab === 'diario' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400']"
        >
          Asistencia Diaria
        </button>
        <button
          @click="activeTab = 'quincenal'"
          :class="['px-5 py-3 font-semibold text-sm border-b-2 transition-all -mb-px', activeTab === 'quincenal' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400']"
        >
          Corte Quincenal
        </button>
        <button
          @click="activeTab = 'configuracion'"
          :class="['px-5 py-3 font-semibold text-sm border-b-2 transition-all -mb-px', activeTab === 'configuracion' ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400']"
        >
          Configuración GPS
        </button>
      </div>

      <!-- ── Tab 1: Diario ── -->
      <div v-if="activeTab === 'diario'" class="space-y-5 sm:space-y-6">
        <!-- ── Header ─────────────────────────────────────────────────── -->
        <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Nómina</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Gestión de horarios y asistencia del personal</p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Filtros de Fecha -->
            <div class="flex items-center gap-2 bg-white dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
              <button
                @click="filterType = 'hoy'"
                :class="['px-3 py-1.5 rounded-lg font-medium transition-colors', filterType === 'hoy' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']"
              >Hoy</button>
              <div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div class="relative flex items-center">
                <button
                  @click="filterType = 'dia'"
                  :class="['px-3 py-1.5 rounded-lg font-medium transition-colors', filterType === 'dia' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']"
                >Día</button>
                <div v-show="filterType === 'dia'" class="ml-2 w-36">
                  <input
                    type="date"
                    v-model="filterDate"
                    class="h-[34px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>
              </div>
            </div>

            <!-- Búsqueda -->
            <div class="relative w-full sm:w-56">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar empleado..."
                class="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white"
              />
              <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Botón Exportar Diario -->
            <Button size="md" variant="outline" @click="exportarDiario" class="rounded-full" :disabled="filteredEmpleados.length === 0">
              Exportar CSV
            </Button>

            <!-- Botón Agregar -->
            <Button size="md" variant="primary" @click="abrirAgregarNuevo" class="rounded-full">
              Agregar a Nómina
            </Button>
          </div>
        </div>

        <!-- ── Tabla principal ────────────────────────────────────────── -->
        <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="max-w-full overflow-x-auto custom-scrollbar">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th class="px-5 py-3 text-left">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Empleado</p>
                  </th>
                  <th class="px-5 py-3 text-left">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Rol</p>
                  </th>
                  <th class="px-5 py-3 text-left">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Horario</p>
                  </th>
                  <th class="px-5 py-3 text-left">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Fecha</p>
                  </th>
                  <th class="px-5 py-3 text-center">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Estado</p>
                  </th>
                  <th class="px-5 py-3 text-center">
                    <p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400 uppercase tracking-wider">Acciones</p>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <!-- Loading -->
                <tr v-if="loading">
                  <td colspan="6" class="px-5 py-10 text-center text-gray-400 text-sm">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Cargando nómina...
                    </div>
                  </td>
                </tr>
                <!-- Empty state -->
                <tr v-else-if="filteredEmpleados.length === 0">
                  <td colspan="6" class="px-5 py-12 text-center">
                    <div class="flex flex-col items-center gap-2">
                      <svg class="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      <p class="text-gray-500 dark:text-gray-400 text-sm">No hay registros de nómina para este día.</p>
                      <p class="text-gray-400 dark:text-gray-500 text-xs">Agrega empleados con el botón superior.</p>
                    </div>
                  </td>
                </tr>
                <!-- Filas -->
                <tr
                  v-for="empleado in filteredEmpleados"
                  :key="empleado.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                >
                  <td class="px-5 py-4">
                    <p class="font-semibold text-gray-800 text-sm dark:text-white/90">{{ empleado.usuario }}</p>
                  </td>
                  <td class="px-5 py-4">
                    <span class="inline-flex font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-0.5 rounded-md text-xs">
                      {{ empleado.rol }}
                    </span>
                  </td>
                  <td class="px-5 py-4">
                    <p class="text-gray-600 font-medium text-sm dark:text-gray-300">
                      {{ empleado.hora_entrada }} – {{ empleado.hora_salida }}
                    </p>
                  </td>
                  <td class="px-5 py-4">
                    <p class="text-gray-500 text-sm dark:text-gray-400">{{ empleado.fecha }}</p>
                  </td>
                  <td class="px-5 py-4 text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span
                        class="inline-flex px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider"
                        :class="estadoBadgeClass(empleado.estadoChecado)"
                      >
                        {{ estadoLabel(empleado.estadoChecado) }}
                      </span>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span v-if="empleado.horaExacta" class="text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded" title="Hora de entrada">
                          Ent: {{ empleado.horaExacta }}
                        </span>
                        <span v-if="empleado.horaExactaSalida" class="text-xs text-gray-500 font-medium whitespace-nowrap bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded flex items-center gap-1" title="Hora de salida">
                          <span>Sal: {{ empleado.horaExactaSalida }}</span>
                          <span v-if="empleado.horas_extras_mins && empleado.horas_extras_mins > 0" class="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                            (+{{ formatMinutos(empleado.horas_extras_mins) }})
                          </span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        @click="abrirDetalle(empleado)"
                        class="text-gray-400 hover:text-brand-500 transition-colors p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
                        title="Ver Detalles"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        @click="abrirEditar(empleado)"
                        class="text-gray-400 hover:text-brand-500 transition-colors p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20"
                        title="Editar"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── Tab 2: Quincenal ── -->
      <div v-else-if="activeTab === 'quincenal'" class="space-y-5 sm:space-y-6 animate-modal-in">
        <!-- Selectores -->
        <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 min-w-[200px] w-full">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Empleado</label>
            <select
              v-model="corteUsuarioId"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Selecciona un empleado...</option>
              <option v-for="u in users" :key="u.id" :value="u.id">
                {{ u.name }}
              </option>
            </select>
          </div>

          <div class="w-full md:w-44">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Quincena</label>
            <select
              v-model="corteQuincena"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option :value="1">1ra (Días 1-15)</option>
              <option :value="2">2da (Días 16-Fin)</option>
            </select>
          </div>

          <div class="w-full md:w-40">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Mes</label>
            <select
              v-model="corteMes"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option v-for="m in 12" :key="m" :value="m">
                {{ ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m-1] }}
              </option>
            </select>
          </div>

          <div class="w-full md:w-32">
            <label class="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">Año</label>
            <select
              v-model="corteAnio"
              class="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-brand-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option :value="2026">2026</option>
              <option :value="2025">2025</option>
            </select>
          </div>

          <Button size="md" variant="primary" @click="generarCorte" :disabled="corteLoading" class="rounded-xl w-full md:w-auto h-[38px] flex items-center justify-center">
            <svg v-if="corteLoading" class="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            {{ corteLoading ? 'Calculando...' : 'Generar Corte' }}
          </Button>

          <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Button v-if="corteResumen" size="md" variant="outline" @click="exportarQuincenal" class="rounded-xl w-full md:w-auto h-[38px] flex items-center justify-center">
              Exportar CSV
            </Button>
            <Button v-if="corteResumen" size="md" variant="outline" @click="exportarQuincenalPDF" class="rounded-xl w-full md:w-auto h-[38px] flex items-center justify-center border-brand-500 text-brand-600 hover:bg-brand-50 dark:border-brand-400 dark:text-brand-400 dark:hover:bg-brand-900/20">
              Exportar PDF
            </Button>
          </div>
        </div>

        <!-- Resultados del Corte -->
        <div v-if="corteResumen" class="space-y-6 animate-modal-in">
          <!-- Tarjetas Métricas -->
          <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <!-- Días Trabajados -->
            <div class="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 p-5 rounded-2xl text-center space-y-2">
              <div class="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p class="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Días Trabajados</p>
              <p class="text-3xl font-extrabold text-gray-800 dark:text-white">{{ corteResumen.dias_trabajados }}</p>
            </div>
            <!-- Entradas -->
            <div class="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl text-center space-y-2">
              <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h3a3 3 0 013 3v1" />
                </svg>
              </div>
              <p class="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Entradas</p>
              <p class="text-3xl font-extrabold text-gray-800 dark:text-white">{{ corteResumen.entradas }}</p>
            </div>
            <!-- Salidas -->
            <div class="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-5 rounded-2xl text-center space-y-2">
              <div class="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h3a3 3 0 013 3v1" />
                </svg>
              </div>
              <p class="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Salidas</p>
              <p class="text-3xl font-extrabold text-gray-800 dark:text-white">{{ corteResumen.salidas }}</p>
            </div>
            <!-- Retardos -->
            <div class="bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 p-5 rounded-2xl text-center space-y-2">
              <div class="w-10 h-10 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p class="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Retardos</p>
              <p class="text-3xl font-extrabold text-gray-800 dark:text-white">{{ corteResumen.retardos }}</p>
            </div>
            <!-- Faltas -->
            <div class="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 p-5 rounded-2xl text-center space-y-2 col-span-2 lg:col-span-1">
              <div class="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p class="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Faltas</p>
              <p class="text-3xl font-extrabold text-gray-800 dark:text-white">{{ corteResumen.faltas }}</p>
            </div>
          </div>

          <!-- Tabla Detallada -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="max-w-full overflow-x-auto custom-scrollbar">
              <table class="min-w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <th class="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                    <th class="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Horario Teórico</th>
                    <th class="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Llegada Real</th>
                    <th class="px-5 py-3 text-left font-bold text-gray-500 uppercase tracking-wider">Salida Real</th>
                    <th class="px-5 py-3 text-center font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="r in corteDetalle" :key="r.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td class="px-5 py-4 font-mono font-medium text-gray-800 dark:text-white">{{ r.fecha.split('-').reverse().join('/') }}</td>
                    <td class="px-5 py-4 text-gray-600 dark:text-gray-300 font-medium">{{ r.hora_entrada }} – {{ r.hora_salida }}</td>
                    <td class="px-5 py-4 font-mono text-gray-500 dark:text-gray-400">{{ r.horaExacta || '—' }}</td>
                    <td class="px-5 py-4 font-mono text-gray-500 dark:text-gray-400">
                      {{ r.horaExactaSalida || '—' }}
                      <span v-if="r.horas_extras_mins && r.horas_extras_mins > 0" class="text-xs font-bold text-purple-600 dark:text-purple-400 ml-1">
                        (+{{ formatMinutos(r.horas_extras_mins) }})
                      </span>
                    </td>
                    <td class="px-5 py-4 text-center">
                      <span class="inline-flex px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider" :class="estadoBadgeClass(r.estadoChecado)">
                        {{ estadoLabel(r.estadoChecado) }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div v-else-if="!corteLoading" class="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-100 dark:border-gray-700/50 shadow-sm text-center text-gray-400">
          Selecciona un empleado y periodo para generar el reporte quincenal.
        </div>
      </div>

      <!-- ── Tab 3: Configuración GPS ── -->
      <div v-else-if="activeTab === 'configuracion'" class="space-y-6 animate-modal-in">
        <div class="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700/50 shadow-sm max-w-3xl space-y-6">
          <div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">Ubicación del Restaurante</h3>
          </div>

          <div class="border-t border-gray-100 dark:border-gray-700/50"></div>

          <!-- Link de Google Maps -->
          <div class="space-y-2">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-300">
              Enlace de Google Maps
            </label>
            <div class="flex gap-2">
              <input
                type="text"
                v-model="googleMapsLink"
                placeholder="Pega el enlace de Google Maps aquí (ej. https://maps.app.goo.gl/... o https://www.google.com/maps/...)"
                class="flex-1 h-11 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
              <button
                type="button"
                @click="procesarEnlaceGoogleMaps"
                :disabled="loadingLink || !googleMapsLink"
                class="h-11 px-5 rounded-xl text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
              >
                <svg v-if="loadingLink" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Procesar
              </button>
            </div>

          </div>

          <div class="border-t border-gray-100 dark:border-gray-700/50"></div>

          <!-- Coordenadas -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Latitud</label>
              <input
                type="number"
                step="any"
                v-model.number="configUbicacion.latitud"
                class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Longitud</label>
              <input
                type="number"
                step="any"
                v-model.number="configUbicacion.longitud"
                class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">Radio de checado (metros)</label>
              <input
                type="number"
                v-model.number="configUbicacion.radio"
                class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>

          <!-- Mapa / Vista en Google Maps Link -->
          <div v-if="configUbicacion.latitud && configUbicacion.longitud" class="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span class="text-xs font-bold text-gray-500 dark:text-gray-400 block uppercase tracking-wider">Ubicación Actual</span>
              <span class="text-sm font-semibold text-gray-800 dark:text-white mt-0.5 inline-block">
                📍 {{ configUbicacion.latitud.toFixed(6) }}, {{ configUbicacion.longitud.toFixed(6) }} (Radio: {{ configUbicacion.radio }}m)
              </span>
            </div>
            <a
              :href="`https://www.google.com/maps/search/?api=1&query=${configUbicacion.latitud},${configUbicacion.longitud}`"
              target="_blank"
              class="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              Ver en Google Maps
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          <div class="flex justify-end pt-4">
            <button
              type="button"
              @click="guardarConfigUbicacion"
              :disabled="savingConfig || !configUbicacion.latitud || !configUbicacion.longitud || !configUbicacion.radio"
              class="px-5 py-2.5 rounded-xl text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5"
            >
              <svg v-if="savingConfig" class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- Modal: Agregar / Editar Nómina                                -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeModal"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-modal-in max-h-[95vh]">

          <!-- Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30 flex-shrink-0">
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">
                {{ modoEdicion ? 'Editar Horario' : 'Configurar Horario' }}
              </h3>
            </div>
            <button @click="closeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Tabs (Segmented Control) -->
          <div class="px-6 pt-4 flex-shrink-0">
            <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
              <button
                type="button"
                @click="tipoHorario = 'permanente'"
                :class="[
                  'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                  tipoHorario === 'permanente'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Horario Permanente
              </button>
              <button
                type="button"
                @click="tipoHorario = 'excepcion'"
                :class="[
                  'flex-1 py-2 text-sm font-semibold rounded-lg transition-all',
                  tipoHorario === 'excepcion'
                    ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                ]"
              >
                Excepción Temporal
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">

            <!-- 1. Usuario -->
            <div>
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Usuario
              </label>
              <div class="relative">
                <select
                  v-model="formData.usuario_id"
                  class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white appearance-none pr-10"
                  :disabled="loadingHorario"
                >
                  <option value="">Selecciona un usuario...</option>
                  <option v-for="u in users" :key="u.id" :value="u.id">
                    {{ u.name }} ({{ u.role }})
                  </option>
                </select>
                <svg class="w-4 h-4 text-gray-400 absolute right-3 top-3 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                <div v-if="loadingHorario" class="absolute right-8 top-2.5">
                  <svg class="animate-spin h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- 2. Rango de fechas (Solo excepciones) -->
            <div v-if="tipoHorario === 'excepcion'" class="space-y-4">
              <div>
                <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Rango de fechas de excepción
                </label>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Desde</label>
                    <input
                      type="date"
                      v-model="excepcionFechaInicio"
                      class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
                    <input
                      type="date"
                      v-model="excepcionFechaFin"
                      class="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <!-- Tipo de configuración de excepción -->
              <div>
                <label class="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  Configuración de excepción
                </label>
                <div class="flex gap-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                  <button
                    type="button"
                    @click="modoConfiguracionExcepcion = 'repetitivo'"
                    :class="[
                      'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                      modoConfiguracionExcepcion === 'repetitivo'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    ]"
                  >
                    Repetitivo (por día de la semana)
                  </button>
                  <button
                    type="button"
                    @click="modoConfiguracionExcepcion = 'individual'"
                    :class="[
                      'flex-1 py-1.5 text-xs font-bold rounded-lg transition-all',
                      modoConfiguracionExcepcion === 'individual'
                        ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    ]"
                  >
                    Individual (por fecha específica)
                  </button>
                </div>
              </div>
            </div>

            <!-- 3. Horario masivo -->
            <div v-if="tipoHorario === 'permanente' || (tipoHorario === 'excepcion' && modoConfiguracionExcepcion === 'repetitivo')" class="bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-700/30 rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <label class="text-sm font-bold text-brand-700 dark:text-brand-400">
                  Aplicar horario a múltiples días
                </label>
              </div>
              <div class="flex flex-wrap gap-2 mb-3">
                <button
                  v-for="(dia, idx) in DIAS_SEMANA"
                  v-show="activeWeekdays.includes(idx)"
                  :key="idx"
                  type="button"
                  @click="toggleBulkDay(idx)"
                  :class="[
                    'px-3 py-1.5 rounded-lg text-xs font-bold border transition-all',
                    bulkSelectedDays.includes(idx)
                      ? 'bg-brand-500 text-white border-brand-600 shadow-sm'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-400'
                  ]"
                >
                  {{ dia.short }}
                </button>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Entrada</label>
                  <TimeDropdown v-model="bulkHoraEntrada" placeholder="Entrada" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Salida</label>
                  <TimeDropdown v-model="bulkHoraSalida" placeholder="Salida" />
                </div>
              </div>
              <button
                type="button"
                @click="applyBulkSchedule"
                :disabled="!bulkSelectedDays.length || !bulkHoraEntrada || !bulkHoraSalida"
                class="mt-3 w-full py-2 rounded-lg text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Aplicar a {{ bulkSelectedDays.length }} día{{ bulkSelectedDays.length !== 1 ? 's' : '' }} seleccionado{{ bulkSelectedDays.length !== 1 ? 's' : '' }}
              </button>
            </div>

            <!-- 4. Configuración por día -->
            <div v-if="tipoHorario === 'permanente' || (tipoHorario === 'excepcion' && modoConfiguracionExcepcion === 'repetitivo')">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Configuración por día
              </label>
              <div class="space-y-2">
                <div
                  v-for="(dia, idx) in diasSemana"
                  v-show="activeWeekdays.includes(idx)"
                  :key="idx"
                  :class="[
                    'rounded-xl border transition-all overflow-hidden',
                    dia.tipo === 'descanso'
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-70'
                      : dia.activo
                        ? 'border-brand-200 dark:border-brand-700/40 bg-white dark:bg-gray-800/50'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/20'
                  ]"
                >
                  <div class="flex items-center gap-3 px-4 py-3">
                    <!-- Checkbox activar día -->
                    <button
                      type="button"
                      @click="toggleDiaActivo(idx)"
                      :disabled="dia.tipo === 'descanso'"
                      :class="[
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        dia.tipo === 'descanso'
                          ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : dia.activo
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                      ]"
                    >
                      <svg v-if="dia.activo && dia.tipo !== 'descanso'" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </button>

                    <!-- Nombre del día -->
                    <span class="w-10 text-sm font-bold text-gray-700 dark:text-gray-300 flex-shrink-0">
                      {{ DIAS_SEMANA[idx].short }}
                    </span>


                    <!-- Horario (solo si activo y laboral) -->
                    <div v-if="dia.activo && dia.tipo === 'laboral'" class="flex items-center gap-2 flex-1">
                      <div class="flex-1">
                        <TimeDropdown v-model="dia.hora_entrada" placeholder="Entrada" compact />
                      </div>
                      <span class="text-gray-400 text-xs font-bold">–</span>
                      <div class="flex-1">
                        <TimeDropdown v-model="dia.hora_salida" placeholder="Salida" compact />
                      </div>
                    </div>

                    <!-- Descanso label -->
                    <div v-else-if="dia.tipo === 'descanso'" class="flex-1 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                      </svg>
                      <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">Día de descanso</span>
                      <label class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer ml-3 bg-indigo-50/50 dark:bg-indigo-950/25 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/30">
                        <input type="checkbox" v-model="dia.pagado" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5" />
                        <span>Pagado</span>
                      </label>
                    </div>

                    <!-- Spacer -->
                    <div v-else class="flex-1"></div>

                    <!-- Toggle descanso -->
                    <button
                      type="button"
                      @click="toggleDescanso(idx)"
                      :title="dia.tipo === 'descanso' ? 'Quitar descanso' : 'Marcar como descanso'"
                      :class="[
                        'ml-auto flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                        dia.tipo === 'descanso'
                          ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/40'
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 dark:hover:bg-indigo-900/20'
                      ]"
                    >
                      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                      </svg>
                      <span class="hidden sm:inline">{{ dia.tipo === 'descanso' ? 'Quitar' : 'Descanso' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 5. Configuración por fecha específica (Solo excepciones individuales) -->
            <div v-if="tipoHorario === 'excepcion' && modoConfiguracionExcepcion === 'individual'">
              <label class="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Configuración detallada por fecha
              </label>
              <div v-if="diasIndividuales.length === 0" class="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">
                Selecciona un rango de fechas válido (máximo 31 días) para configurar.
              </div>
              <div v-else class="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                <div
                  v-for="dia in diasIndividuales"
                  :key="dia.fecha"
                  :class="[
                    'rounded-xl border transition-all overflow-hidden p-3.5',
                    dia.tipo === 'descanso'
                      ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 opacity-70'
                      : dia.activo
                        ? 'border-brand-200 dark:border-brand-700/40 bg-white dark:bg-gray-800/50'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/20'
                  ]"
                >
                  <div class="flex items-center gap-3">
                    <!-- Checkbox activar día -->
                    <button
                      type="button"
                      @click="dia.tipo !== 'descanso' ? dia.activo = !dia.activo : null"
                      :disabled="dia.tipo === 'descanso'"
                      :class="[
                        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
                        dia.tipo === 'descanso'
                          ? 'border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
                          : dia.activo
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-brand-400'
                      ]"
                    >
                      <svg v-if="dia.activo && dia.tipo !== 'descanso'" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
                      </svg>
                    </button>

                    <!-- Label del día de la semana y fecha -->
                    <div class="flex flex-col flex-shrink-0 min-w-[120px]">
                      <span class="text-sm font-bold text-gray-700 dark:text-gray-300 leading-tight">
                        {{ dia.label.split(' ')[0] }}
                      </span>
                      <span class="text-xs text-gray-400 dark:text-gray-500">
                        {{ dia.label.split(' ')[1] }}
                      </span>
                    </div>

                    <!-- Horario (solo si activo y laboral) -->
                    <div v-if="dia.activo && dia.tipo === 'laboral'" class="flex items-center gap-2 flex-1">
                      <div class="flex-1">
                        <TimeDropdown v-model="dia.hora_entrada" placeholder="Entrada" compact />
                      </div>
                      <span class="text-gray-400 text-xs font-bold">–</span>
                      <div class="flex-1">
                        <TimeDropdown v-model="dia.hora_salida" placeholder="Salida" compact />
                      </div>
                    </div>

                    <!-- Descanso label -->
                    <div v-else-if="dia.tipo === 'descanso'" class="flex-1 flex items-center gap-1.5">
                      <svg class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                      </svg>
                      <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">Descanso</span>
                      <label class="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 cursor-pointer ml-2 bg-indigo-50/50 dark:bg-indigo-950/25 px-2 py-0.5 rounded border border-indigo-100/50 dark:border-indigo-900/30">
                        <input type="checkbox" v-model="dia.pagado" class="rounded border-gray-300 text-brand-600 focus:ring-brand-500 w-3.5 h-3.5" />
                        <span>Pagado</span>
                      </label>
                    </div>

                    <!-- Spacer when not active -->
                    <div v-else class="flex-1 flex items-center">
                      <span class="text-xs text-gray-400 italic">Heredar plantilla</span>
                    </div>

                    <!-- Toggle descanso -->
                    <button
                      type="button"
                      @click="toggleDescansoIndividual(dia)"
                      :title="dia.tipo === 'descanso' ? 'Quitar descanso' : 'Marcar como descanso'"
                      :class="[
                        'ml-auto flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all',
                        dia.tipo === 'descanso'
                          ? 'bg-indigo-100 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-700/40'
                          : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600 hover:bg-indigo-50 hover:text-indigo-500 hover:border-indigo-200 dark:hover:bg-indigo-900/20'
                      ]"
                    >
                      <span v-if="dia.tipo === 'descanso'">Laboral</span>
                      <span v-else>Descanso</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen -->
            <div v-if="resumenDias.laborales > 0 || resumenDias.descanso > 0" class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-brand-500 inline-block"></span>
                {{ resumenDias.laborales }} día{{ resumenDias.laborales !== 1 ? 's' : '' }} laboral{{ resumenDias.laborales !== 1 ? 'es' : '' }}
              </span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-indigo-400 inline-block"></span>
                {{ resumenDias.descanso }} de descanso
              </span>
              <span class="text-gray-300 dark:text-gray-600">|</span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-gray-300 inline-block"></span>
                {{ resumenDias.inactivos }} sin configurar
              </span>
            </div>
          </div>

          <!-- Footer -->
          <div class="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 flex justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              @click="closeModal"
              class="px-5 py-2.5 rounded-xl font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <Button size="md" variant="primary" @click="guardarNomina" :class="{ 'opacity-50 cursor-not-allowed': saving }">
              <svg v-if="saving" class="animate-spin h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              {{ saving ? 'Guardando...' : 'Guardar' }}
            </Button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- Modal: Detalles de Nómina                                     -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showDetalleModal" class="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDetalleModal"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-modal-in max-h-[90vh]">

          <!-- Header -->
          <div class="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
            <div>
              <h3 class="text-lg font-bold text-gray-800 dark:text-white">Historial de {{ selectedDetalleUsuario?.usuario }}</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Registros de nómina del empleado</p>
            </div>
            <div class="flex items-center gap-3">
              <!-- Botón Desvincular -->
              <button 
                @click="desvincularDispositivo" 
                class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-colors flex items-center gap-1.5 border border-red-100 dark:border-red-800/50"
                title="Elimina el dispositivo vinculado activo de este empleado"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Desvincular Celular
              </button>

              <!-- Botón Generar Link -->
              <button @click="generarLinkChecador" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 transition-colors flex items-center gap-1.5 border border-indigo-100 dark:border-indigo-800/50">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link Checador
              </button>
              <!-- Botón Cerrar -->
              <button @click="closeDetalleModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Filtro del modal de detalles -->
          <div class="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
              <button
                @click="detalleFilterType = 'hoy'"
                :class="['px-3 py-1.5 rounded-lg font-medium transition-colors', detalleFilterType === 'hoy' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']"
              >Hoy</button>
              <div class="h-4 w-px bg-gray-200 dark:bg-gray-700"></div>
              <div class="relative flex items-center">
                <button
                  @click="detalleFilterType = 'dia'"
                  :class="['px-3 py-1.5 rounded-lg font-medium transition-colors', detalleFilterType === 'dia' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400']"
                >Día</button>
                <div v-show="detalleFilterType === 'dia'" class="ml-2 w-36">
                  <input
                    type="date"
                    v-model="detalleFilterDate"
                    class="h-[34px] w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 shadow-sm focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                  />
                </div>
              </div>
            </div>
            <div v-if="detalleLoading" class="text-xs text-gray-500 flex items-center gap-1">
              <svg class="animate-spin h-3 w-3 text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Cargando...
            </div>
          </div>

          <!-- Tabla de detalles -->
          <div class="overflow-y-auto custom-scrollbar flex-1">
            <table class="min-w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th class="px-5 py-3 text-left"><p class="font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Empleado</p></th>
                  <th class="px-5 py-3 text-left"><p class="font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Rol</p></th>
                  <th class="px-5 py-3 text-left"><p class="font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Horario</p></th>
                  <th class="px-5 py-3 text-left"><p class="font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Fecha</p></th>
                  <th class="px-5 py-3 text-center"><p class="font-medium text-gray-500 text-xs uppercase tracking-wider dark:text-gray-400">Estado</p></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-if="filteredDetalleNominas.length === 0">
                  <td colspan="5" class="px-5 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No se encontraron registros para este empleado en esta fecha.
                  </td>
                </tr>
                <tr v-for="emp in filteredDetalleNominas" :key="emp.id" class="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td class="px-5 py-4"><p class="font-semibold text-gray-800 text-sm dark:text-white/90">{{ emp.usuario }}</p></td>
                  <td class="px-5 py-4"><span class="inline-flex font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 px-2.5 py-0.5 rounded-md text-xs">{{ emp.rol }}</span></td>
                  <td class="px-5 py-4"><p class="text-gray-600 font-medium text-sm dark:text-gray-300">{{ emp.hora_entrada }} – {{ emp.hora_salida }}</p></td>
                  <td class="px-5 py-4"><p class="text-gray-500 text-sm dark:text-gray-400">{{ emp.fecha }}</p></td>
                  <td class="px-5 py-4 text-center">
                    <div class="flex flex-col items-center gap-1">
                      <span class="inline-flex px-2 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider" :class="estadoBadgeClass(emp.estadoChecado)">
                        {{ estadoLabel(emp.estadoChecado) }}
                      </span>
                      <div class="flex items-center gap-2 mt-0.5">
                        <span v-if="emp.horaExacta" class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          Ent: {{ emp.horaExacta }}
                        </span>
                        <span v-if="emp.horaExactaSalida" class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                          Sal: {{ emp.horaExactaSalida }}
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal: Link Generado -->
    <Teleport to="body">
      <div v-if="showLinkModal" class="fixed inset-0 z-[999999] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showLinkModal = false"></div>
        <div class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700 animate-modal-in">
          
          <div class="text-center space-y-4">
            <div class="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h3 class="text-lg font-bold text-gray-800 dark:text-white">¡Link Generado y Copiado!</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              El enlace de vinculación se ha copiado al portapapeles. Puedes hacer clic en él para abrirlo:
            </p>
            
            <div class="bg-gray-50 dark:bg-gray-850 p-4 rounded-xl border border-gray-150 dark:border-gray-800 text-center font-mono text-xs select-all break-all">
              <a :href="generatedLinkUrl" target="_blank" class="text-brand-600 hover:text-brand-700 hover:underline dark:text-brand-400 font-semibold">
                {{ generatedLinkUrl }}
              </a>
            </div>
            
            <p class="text-[11px] text-gray-400 dark:text-gray-500">
              Compártelo con el empleado para que registre su dispositivo.
            </p>
          </div>
          
          <div class="mt-6 flex justify-end gap-3">
            <button
              @click="copiarLinkPortapapeles"
              class="px-5 py-2.5 rounded-xl font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white transition-colors text-sm flex items-center gap-1.5"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copiar Enlace
            </button>
            <button
              @click="showLinkModal = false"
              class="px-5 py-2.5 rounded-xl font-bold bg-brand-500 text-white hover:bg-brand-600 transition-colors text-sm"
            >
              Cerrar
            </button>
          </div>
          
        </div>
      </div>
    </Teleport>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import AdminLayout from '@/components/layout/AdminLayout.vue';
import Button from '@/components/ui/Button.vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import TimeDropdown from './TimeDropdown.vue';
import { useNomina, type NominaRegistro } from '@/composables/useNomina';
import { authFetch } from '@/utils/api';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface User {
    id: number;
    name: string;
    role: string;
}

interface DiaConfig {
    activo: boolean;
    tipo: 'laboral' | 'descanso';
    pagado: boolean;
    hora_entrada: string;
    hora_salida: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────
const DIAS_SEMANA = [
    { name: 'Lunes',     short: 'Lun' },
    { name: 'Martes',    short: 'Mar' },
    { name: 'Miércoles', short: 'Mié' },
    { name: 'Jueves',    short: 'Jue' },
    { name: 'Viernes',   short: 'Vie' },
    { name: 'Sábado',    short: 'Sáb' },
    { name: 'Domingo',   short: 'Dom' },
];

// ── Composables ───────────────────────────────────────────────────────────────
const {
    nominas, loading,
    fetchNominas,
    createNomina, updateNominaSemana,
    getHorarioSemanal, saveHorarioSemanal, saveHorarioExcepcion,
} = useNomina();

// Instancia separada para el modal de detalles
const { nominas: detalleNominasRaw, loading: detalleLoading, fetchNominas: fetchDetalleNominas } = useNomina();

// ── Estado global ─────────────────────────────────────────────────────────────
const users = ref<User[]>([]);
const searchQuery = ref('');
const filterType = ref('hoy');
const filterDate = ref('');

// Modal principal
const showModal = ref(false);
const modoEdicion = ref(false);
const saving = ref(false);
const loadingHorario = ref(false);

// Nueva pestaña del modal y estados de excepción
const tipoHorario = ref<'permanente' | 'excepcion'>('permanente');
const excepcionFechaInicio = ref('');
const excepcionFechaFin = ref('');

// Modal detalles
const showDetalleModal = ref(false);
const selectedDetalleUsuario = ref<NominaRegistro | null>(null);
const detalleFilterType = ref('hoy');
const detalleFilterDate = ref('');

// Modal Link Generado
const showLinkModal = ref(false);
const generatedLinkUrl = ref('');

const copiarLinkPortapapeles = async () => {
    try {
        await navigator.clipboard.writeText(generatedLinkUrl.value);
        alert('Enlace copiado al portapapeles con éxito.');
    } catch (err) {
        alert('Error al copiar el enlace.');
    }
};

// ── Formulario del modal ───────────────────────────────────────────────────────
const formData = ref({
    usuario_id: '' as string | number,
    rol: '',
    semanaInicio: '',
});

const diasSemana = ref<DiaConfig[]>(
    DIAS_SEMANA.map(() => ({ activo: false, tipo: 'laboral' as const, pagado: false, hora_entrada: '', hora_salida: '' }))
);

const bulkSelectedDays = ref<number[]>([]);
const bulkHoraEntrada = ref('');
const bulkHoraSalida = ref('');

// ── Lógica de Excepciones Individuales ──────────────────────────────────────────
const modoConfiguracionExcepcion = ref<'repetitivo' | 'individual'>('repetitivo');
const isInitializingEdit = ref(false);

interface DiaIndividualConfig {
    fecha: string;
    label: string;
    activo: boolean;
    tipo: 'laboral' | 'descanso';
    pagado: boolean;
    hora_entrada: string;
    hora_salida: string;
}

const diasIndividuales = ref<DiaIndividualConfig[]>([]);

const actualizarDiasIndividuales = (forceOverride = false) => {
    if (!excepcionFechaInicio.value || !excepcionFechaFin.value) {
        diasIndividuales.value = [];
        return;
    }
    const start = new Date(excepcionFechaInicio.value + 'T12:00:00');
    const end = new Date(excepcionFechaFin.value + 'T12:00:00');
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        diasIndividuales.value = [];
        return;
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (diffDays > 31) {
        diasIndividuales.value = [];
        return;
    }

    const nuevosDias: DiaIndividualConfig[] = [];
    const current = new Date(start);
    const oldMap = new Map(diasIndividuales.value.map(d => [d.fecha, d]));

    while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];
        const dayJS = current.getDay();
        const dayDB = dayJS === 0 ? 6 : dayJS - 1;
        const diaSemanaLabel = DIAS_SEMANA[dayDB].name;
        
        const [y, m, d] = dateStr.split('-');
        const label = `${diaSemanaLabel} ${d}/${m}`;

        const oldConfig = oldMap.get(dateStr);
        const template = diasSemana.value[dayDB];

        if (oldConfig && !forceOverride) {
            nuevosDias.push(oldConfig);
        } else {
            nuevosDias.push({
                fecha: dateStr,
                label,
                activo: template?.activo ?? false,
                tipo: template?.tipo ?? 'laboral',
                pagado: template?.pagado ?? false,
                hora_entrada: template?.hora_entrada ?? '',
                hora_salida: template?.hora_salida ?? '',
            });
        }
        current.setDate(current.getDate() + 1);
    }
    diasIndividuales.value = nuevosDias;
};

const toggleDescansoIndividual = (dia: DiaIndividualConfig) => {
    if (dia.tipo === 'descanso') {
        dia.tipo = 'laboral';
        dia.activo = false;
    } else {
        dia.tipo = 'descanso';
        dia.activo = false;
        dia.hora_entrada = '';
        dia.hora_salida = '';
    }
};

watch([excepcionFechaInicio, excepcionFechaFin], () => {
    if (modoConfiguracionExcepcion.value === 'individual') {
        actualizarDiasIndividuales(false); // preserve edits on date change
    }
});

watch(modoConfiguracionExcepcion, (newVal) => {
    if (newVal === 'individual') {
        if (isInitializingEdit.value) return; // skip override during edit initialization!
        actualizarDiasIndividuales(true); // force copy from repetitive tab when switching!
    }
});

watch(diasSemana, () => {
    if (modoConfiguracionExcepcion.value === 'individual') {
        actualizarDiasIndividuales(false);
    }
}, { deep: true });


// ── Helpers de fecha ──────────────────────────────────────────────────────────
const getTodayString = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getDiaFecha = (idx: number): string => {
    if (!formData.value.semanaInicio) return '—';
    const base = new Date(formData.value.semanaInicio + 'T12:00:00');
    const dayOfWeek = base.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(base);
    monday.setDate(base.getDate() + diffToMonday);
    const target = new Date(monday);
    target.setDate(monday.getDate() + idx);
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
};

const semanaDatesLabel = computed(() => {
    if (!formData.value.semanaInicio) return '';
    const lun = getDiaFecha(0);
    const dom = getDiaFecha(6);
    if (!lun || lun === '—') return '';
    const fmt = (s: string) => {
        const [y, m, d] = s.split('-');
        return `${d}/${m}/${y}`;
    };
    return `${fmt(lun)} — ${fmt(dom)}`;
});

const resumenDias = computed(() => {
    let laborales = 0, descanso = 0, inactivos = 0;
    const targetArray = (tipoHorario.value === 'excepcion' && modoConfiguracionExcepcion.value === 'individual')
        ? diasIndividuales.value
        : diasSemana.value;

    for (const d of targetArray) {
        if (d.tipo === 'descanso') descanso++;
        else if (d.activo) laborales++;
        else inactivos++;
    }
    return { laborales, descanso, inactivos };
});

const activeWeekdays = computed<number[]>(() => {
    if (tipoHorario.value === 'permanente') {
        return [0, 1, 2, 3, 4, 5, 6];
    }
    
    if (!excepcionFechaInicio.value || !excepcionFechaFin.value) {
        return [0, 1, 2, 3, 4, 5, 6];
    }

    const start = new Date(excepcionFechaInicio.value + 'T12:00:00');
    const end = new Date(excepcionFechaFin.value + 'T12:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
        return [0, 1, 2, 3, 4, 5, 6];
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 6) {
        return [0, 1, 2, 3, 4, 5, 6];
    }

    const included = new Set<number>();
    const current = new Date(start);
    while (current <= end) {
        const dayJS = current.getDay();
        const dayDB = dayJS === 0 ? 6 : dayJS - 1;
        included.add(dayDB);
        current.setDate(current.getDate() + 1);
    }

    return Array.from(included).sort((a, b) => a - b);
});

watch(activeWeekdays, (newVal) => {
    bulkSelectedDays.value = bulkSelectedDays.value.filter(idx => newVal.includes(idx));
});

// ── Filtros de fecha ──────────────────────────────────────────────────────────
const currentDateString = computed(() =>
    filterType.value === 'hoy' ? getTodayString() : (filterDate.value || getTodayString())
);

const currentDetalleDateString = computed(() =>
    detalleFilterType.value === 'hoy' ? getTodayString() : (detalleFilterDate.value || getTodayString())
);

watch(currentDateString, (newDate) => {
    if (newDate) fetchNominas(newDate);
});

watch(currentDetalleDateString, (newDate) => {
    if (newDate && showDetalleModal.value) fetchDetalleNominas(newDate);
});

// ── Computed: tabla principal ─────────────────────────────────────────────────
const filteredEmpleados = computed(() => {
    if (!searchQuery.value) return nominas.value;
    const q = searchQuery.value.toLowerCase();
    return nominas.value.filter(emp =>
        emp.usuario.toLowerCase().includes(q) ||
        emp.rol.toLowerCase().includes(q)
    );
});

// ── Computed: detalles ────────────────────────────────────────────────────────
const filteredDetalleNominas = computed(() => {
    if (!selectedDetalleUsuario.value) return [];
    return detalleNominasRaw.value.filter(n => n.usuario_id === selectedDetalleUsuario.value!.usuario_id);
});

// ── Autocompletar rol y cargar horario al seleccionar usuario ─────────────────
watch(() => formData.value.usuario_id, async (newId) => {
    if (newId) {
        const selectedUser = users.value.find(u => u.id === Number(newId));
        if (selectedUser?.role) formData.value.rol = selectedUser.role;
        loadingHorario.value = true;
        const horario = await getHorarioSemanal(Number(newId));
        loadingHorario.value = false;
        if (horario.length > 0) {
            resetDias();
            for (const d of horario) {
                const idx = d.dia_semana;
                if (idx >= 0 && idx <= 6) {
                    diasSemana.value[idx].tipo = d.tipo;
                    diasSemana.value[idx].pagado = !!d.pagado;
                    if (d.tipo === 'laboral') {
                        diasSemana.value[idx].activo = true;
                        diasSemana.value[idx].hora_entrada = d.hora_entrada || '';
                        diasSemana.value[idx].hora_salida = d.hora_salida || '';
                    } else {
                        diasSemana.value[idx].activo = false;
                    }
                }
            }
        }
    } else {
        formData.value.rol = '';
        resetDias();
    }
});

// ── Montaje ───────────────────────────────────────────────────────────────────
onMounted(async () => {
    try {
        const res = await authFetch('/api/users');
        if (res.ok) users.value = await res.json();
    } catch (err) {
        console.error('Error cargando usuarios:', err);
    }
    fetchNominas(currentDateString.value);
    fetchConfigUbicacion();
});

// ── Acciones de días ──────────────────────────────────────────────────────────
const resetDias = () => {
    diasSemana.value = DIAS_SEMANA.map(() => ({ activo: false, tipo: 'laboral' as const, pagado: false, hora_entrada: '', hora_salida: '' }));
};

const toggleDiaActivo = (idx: number) => {
    if (diasSemana.value[idx].tipo === 'descanso') return;
    diasSemana.value[idx].activo = !diasSemana.value[idx].activo;
};

const toggleDescanso = (idx: number) => {
    if (diasSemana.value[idx].tipo === 'descanso') {
        diasSemana.value[idx].tipo = 'laboral';
        diasSemana.value[idx].activo = false;
    } else {
        diasSemana.value[idx].tipo = 'descanso';
        diasSemana.value[idx].activo = false;
        diasSemana.value[idx].hora_entrada = '';
        diasSemana.value[idx].hora_salida = '';
    }
};

const toggleBulkDay = (idx: number) => {
    const i = bulkSelectedDays.value.indexOf(idx);
    if (i === -1) bulkSelectedDays.value.push(idx);
    else bulkSelectedDays.value.splice(i, 1);
};

const applyBulkSchedule = () => {
    resetDias();
    for (const idx of bulkSelectedDays.value) {
        diasSemana.value[idx].tipo = 'laboral';
        diasSemana.value[idx].activo = true;
        diasSemana.value[idx].hora_entrada = bulkHoraEntrada.value;
        diasSemana.value[idx].hora_salida = bulkHoraSalida.value;
    }
    bulkSelectedDays.value = [];
};

// ── Helpers de estado ─────────────────────────────────────────────────────────
const formatMinutos = (mins?: number): string => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
        return `${h}h${m > 0 ? ` ${m}m` : ''}`;
    }
    return `${m}m`;
};

const estadoBadgeClass = (estado: string) => ({
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':           estado === 'pendiente',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400': estado === 'puntual',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400':        estado === 'retardo',
    'bg-red-600 text-white dark:bg-red-900/80 dark:text-red-200':                  estado === 'regreso',
    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':               estado === 'falta',
    'bg-red-100 text-red-700 border border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30': estado === 'sin_salida',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400':    estado === 'horas_extras',
});

const estadoLabel = (estado: string): string => ({
    pendiente:     'Pendiente',
    puntual:       'Puntual',
    retardo:       'Retardo',
    regreso:       'Regreso',
    falta:         'Falta',
    sin_salida:    'Salida NO Checada',
    horas_extras:  'Horas Extras',
}[estado] ?? estado);

// ── Modal: Agregar / Editar ───────────────────────────────────────────────────
const abrirAgregarNuevo = () => {
    modoEdicion.value = false;
    formData.value = { usuario_id: '', rol: '', semanaInicio: getTodayString() };
    tipoHorario.value = 'permanente';
    modoConfiguracionExcepcion.value = 'repetitivo';
    excepcionFechaInicio.value = '';
    excepcionFechaFin.value = '';
    diasIndividuales.value = [];
    resetDias();
    bulkSelectedDays.value = [];
    bulkHoraEntrada.value = '';
    bulkHoraSalida.value = '';
    showModal.value = true;
};

const abrirEditar = (empleado: NominaRegistro) => {
    isInitializingEdit.value = true;
    modoEdicion.value = true;
    formData.value = {
        usuario_id: empleado.usuario_id,
        rol: empleado.rol,
        semanaInicio: empleado.fecha ?? getTodayString(),
    };
    tipoHorario.value = 'excepcion';
    modoConfiguracionExcepcion.value = 'individual';
    excepcionFechaInicio.value = empleado.fecha ?? getTodayString();
    excepcionFechaFin.value = empleado.fecha ?? getTodayString();
    resetDias();
    bulkSelectedDays.value = [];
    bulkHoraEntrada.value = '';
    bulkHoraSalida.value = '';
    
    if (empleado.fecha) {
        const dayJS = new Date(empleado.fecha + 'T12:00:00').getDay();
        const dayDB = dayJS === 0 ? 6 : dayJS - 1;
        const diaSemanaLabel = DIAS_SEMANA[dayDB].name;
        const [y, m, d] = empleado.fecha.split('-');
        
        diasIndividuales.value = [{
            fecha: empleado.fecha,
            label: `${diaSemanaLabel} ${d}/${m}`,
            activo: !!empleado.hora_entrada,
            tipo: empleado.hora_entrada ? 'laboral' : 'descanso',
            pagado: false,
            hora_entrada: empleado.hora_entrada || '',
            hora_salida: empleado.hora_salida || '',
        }];
    } else {
        diasIndividuales.value = [];
    }

    showModal.value = true;
    
    setTimeout(() => {
        isInitializingEdit.value = false;
    }, 0);
};

const closeModal = () => { showModal.value = false; };

// ── Modal: Detalles ───────────────────────────────────────────────────────────
const abrirDetalle = (empleado: NominaRegistro) => {
    selectedDetalleUsuario.value = empleado;
    detalleFilterType.value = filterType.value;
    detalleFilterDate.value = filterDate.value;
    showDetalleModal.value = true;
    fetchDetalleNominas(currentDetalleDateString.value);
};

const closeDetalleModal = () => {
    showDetalleModal.value = false;
    selectedDetalleUsuario.value = null;
};

const generarLinkChecador = async () => {
    if (!selectedDetalleUsuario.value) return;
    try {
        const res = await authFetch('/api/checador/generar-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: selectedDetalleUsuario.value.usuario_id })
        });
        const data = await res.json();
        if (res.ok) {
            const url = `${window.location.origin}/checador?link_token=${data.linkToken}`;
            // Copiar al portapapeles
            await navigator.clipboard.writeText(url);
            generatedLinkUrl.value = url;
            showLinkModal.value = true;
        } else {
            alert(data.error || 'Error al generar link');
        }
    } catch (err) {
        alert('Error de conexión al generar link');
    }
};

const desvincularDispositivo = async () => {
    if (!selectedDetalleUsuario.value) return;
    if (!confirm(`¿Estás seguro de que deseas desvincular el celular de ${selectedDetalleUsuario.value.usuario}? El empleado no podrá checar hasta que vincules un nuevo dispositivo.`)) {
        return;
    }
    
    try {
        const res = await authFetch('/api/checador/desvincular', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuarioId: selectedDetalleUsuario.value.usuario_id })
        });
        const data = await res.json();
        if (res.ok) {
            alert('El dispositivo ha sido desvinculado con éxito.');
        } else {
            alert(data.error || 'Error al desvincular dispositivo');
        }
    } catch (err) {
        alert('Error de conexión al desvincular dispositivo');
    }
};

// ── Guardar ───────────────────────────────────────────────────────────────────
const guardarNomina = async () => {
    if (!formData.value.usuario_id) {
        alert('Por favor selecciona un usuario');
        return;
    }

    if (tipoHorario.value === 'excepcion') {
        if (!excepcionFechaInicio.value || !excepcionFechaFin.value) {
            alert('Por favor selecciona las fechas de inicio y fin para la excepción');
            return;
        }
        if (excepcionFechaInicio.value > excepcionFechaFin.value) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }
    }

    if (tipoHorario.value === 'permanente' || (tipoHorario.value === 'excepcion' && modoConfiguracionExcepcion.value === 'repetitivo')) {
        const laborales = diasSemana.value
            .map((d, idx) => ({ ...d, idx }))
            .filter(d => d.activo && d.tipo === 'laboral');

        if (laborales.length === 0 && !diasSemana.value.some(d => d.tipo === 'descanso')) {
            alert('Configura al menos un día laboral o de descanso');
            return;
        }

        for (const d of laborales) {
            if (!d.hora_entrada || !d.hora_salida) {
                alert(`El día ${DIAS_SEMANA[d.idx].name} no tiene horario completo`);
                return;
            }
        }
    } else {
        const individualesConfigurados = diasIndividuales.value.some(d => d.tipo === 'descanso' || d.activo);
        if (!individualesConfigurados) {
            alert('Configura al menos un día laboral o de descanso para la excepción individual');
            return;
        }
    }

    saving.value = true;

    let res;
    if (tipoHorario.value === 'permanente') {
        // Preparar payload de días
        const diasPayload = diasSemana.value
            .map((d, idx) => ({
                dia_semana: idx,
                tipo: d.tipo,
                pagado: d.tipo === 'descanso' ? !!d.pagado : false,
                hora_entrada: d.activo && d.tipo === 'laboral' ? d.hora_entrada : null,
                hora_salida:  d.activo && d.tipo === 'laboral' ? d.hora_salida  : null,
            }))
            .filter(d => d.tipo === 'descanso' || (diasSemana.value[d.dia_semana].activo && d.hora_entrada));

        res = await saveHorarioSemanal(Number(formData.value.usuario_id), diasPayload as any);
    } else {
        if (modoConfiguracionExcepcion.value === 'individual') {
            const excLaborales = diasIndividuales.value.filter(d => d.activo && d.tipo === 'laboral');
            for (const d of excLaborales) {
                if (!d.hora_entrada || !d.hora_salida) {
                    alert(`El día ${d.label} no tiene horario completo`);
                    saving.value = false;
                    return;
                }
            }

            const excepcionesPayload = diasIndividuales.value
                .map(d => ({
                    fecha: d.fecha,
                    tipo: d.tipo,
                    pagado: d.tipo === 'descanso' ? !!d.pagado : false,
                    hora_entrada: d.activo && d.tipo === 'laboral' ? d.hora_entrada : null,
                    hora_salida:  d.activo && d.tipo === 'laboral' ? d.hora_salida  : null,
                }))
                .filter(d => d.tipo === 'descanso' || d.hora_entrada);

            res = await saveHorarioExcepcion(
                Number(formData.value.usuario_id),
                excepcionFechaInicio.value,
                excepcionFechaFin.value,
                [],
                'individual',
                excepcionesPayload
            );
        } else {
            const diasPayload = diasSemana.value
                .map((d, idx) => ({
                    dia_semana: idx,
                    tipo: d.tipo,
                    pagado: d.tipo === 'descanso' ? !!d.pagado : false,
                    hora_entrada: d.activo && d.tipo === 'laboral' ? d.hora_entrada : null,
                    hora_salida:  d.activo && d.tipo === 'laboral' ? d.hora_salida  : null,
                }))
                .filter(d => activeWeekdays.value.includes(d.dia_semana))
                .filter(d => d.tipo === 'descanso' || (diasSemana.value[d.dia_semana].activo && d.hora_entrada));

            res = await saveHorarioExcepcion(
                Number(formData.value.usuario_id),
                excepcionFechaInicio.value,
                excepcionFechaFin.value,
                diasPayload as any,
                'repetitivo'
            );
        }
    }

    if (!res.success) {
        alert(res.error || 'Error al guardar el horario');
        saving.value = false;
        return;
    }

    saving.value = false;
    modoEdicion.value = false;
    closeModal();
    fetchNominas(currentDateString.value);
};

// ── Corte Quincenal ──
const activeTab = ref('diario');
const corteUsuarioId = ref('');
const corteMes = ref(new Date().getMonth() + 1);
const corteQuincena = ref(1);
const corteAnio = ref(new Date().getFullYear());
const corteLoading = ref(false);
const corteResumen = ref<any>(null);
const corteDetalle = ref<any[]>([]);

const { getCorteQuincenal } = useNomina();

const generarCorte = async () => {
    if (!corteUsuarioId.value) {
        alert('Por favor selecciona un empleado');
        return;
    }
    
    corteLoading.value = true;
    corteResumen.value = null;
    corteDetalle.value = [];

    const mesStr = String(corteMes.value).padStart(2, '0');
    let fechaInicio = '';
    let fechaFin = '';

    if (corteQuincena.value === 1) {
        fechaInicio = `${corteAnio.value}-${mesStr}-01`;
        fechaFin = `${corteAnio.value}-${mesStr}-15`;
    } else {
        fechaInicio = `${corteAnio.value}-${mesStr}-16`;
        const ultimoDia = new Date(corteAnio.value, corteMes.value, 0).getDate();
        fechaFin = `${corteAnio.value}-${mesStr}-${ultimoDia}`;
    }

    const data = await getCorteQuincenal(Number(corteUsuarioId.value), fechaInicio, fechaFin);
    corteLoading.value = false;

    if (data && !data.error) {
        corteResumen.value = data.resumen;
        corteDetalle.value = data.detalle;
    } else {
        alert(data?.error || 'Error al obtener el corte quincenal');
    }
};

// ── Configuración GPS ──
const googleMapsLink = ref('');
const loadingLink = ref(false);
const savingConfig = ref(false);
const configUbicacion = ref({
    latitud: 19.4422797,
    longitud: -99.2032339,
    radio: 200,
});

const fetchConfigUbicacion = async () => {
    try {
        const res = await authFetch('/api/configuracion');
        if (res.ok) {
            const data = await res.json();
            configUbicacion.value = {
                latitud: data.latitud,
                longitud: data.longitud,
                radio: data.radio,
            };
        }
    } catch (err) {
        console.error('Error fetching config:', err);
    }
};

const guardarConfigUbicacion = async () => {
    savingConfig.value = true;
    try {
        const res = await authFetch('/api/configuracion', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(configUbicacion.value),
        });
        if (res.ok) {
            alert('Configuración de ubicación guardada con éxito.');
        } else {
            const err = await res.json();
            alert(err.error || 'Error al guardar configuración');
        }
    } catch (err) {
        alert('Error de conexión al guardar configuración');
    } finally {
        savingConfig.value = false;
    }
};

const procesarEnlaceGoogleMaps = async () => {
    if (!googleMapsLink.value) return;
    loadingLink.value = true;
    try {
        const res = await authFetch('/api/configuracion/parse-link', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: googleMapsLink.value }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
            configUbicacion.value.latitud = data.lat;
            configUbicacion.value.longitud = data.lng;
            googleMapsLink.value = ''; // limpiar link
            alert('Coordenadas extraídas con éxito y cargadas en los campos.');
        } else {
            alert(data.error || 'Error al procesar el enlace.');
        }
    } catch (err) {
        alert('Error al conectar con el servidor para procesar el enlace.');
    } finally {
        loadingLink.value = false;
    }
};

const exportarDiario = () => {
    if (filteredEmpleados.value.length === 0) return;
    
    const headers = ['Empleado', 'Rol', 'Horario Teórico', 'Fecha', 'Estado Checado', 'Hora Entrada Real', 'Hora Salida Real'];
    const rows = filteredEmpleados.value.map(emp => [
        `"${emp.usuario.replace(/"/g, '""')}"`,
        `"${emp.rol.replace(/"/g, '""')}"`,
        `"${emp.hora_entrada} - ${emp.hora_salida}"`,
        emp.fecha,
        emp.estadoChecado,
        emp.horaExacta || '—',
        emp.horaExactaSalida || '—'
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `asistencia_diaria_${currentDateString.value}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportarQuincenal = () => {
    if (!corteResumen.value || !corteDetalle.value.length) return;
    
    const empName = users.value.find(u => u.id === Number(corteUsuarioId.value))?.name || 'empleado';
    const headers = ['Fecha', 'Horario Teórico', 'Llegada Real', 'Salida Real', 'Estado'];
    const rows = corteDetalle.value.map(r => [
        r.fecha.split('-').reverse().join('/'),
        `"${r.hora_entrada} - ${r.hora_salida}"`,
        r.horaExacta || '—',
        r.horaExactaSalida || '—',
        r.estadoChecado
    ]);
    
    rows.push([]);
    rows.push(['RESUMEN DE QUINCENA']);
    rows.push(['Días Trabajados', corteResumen.value.dias_trabajados]);
    rows.push(['Total Entradas', corteResumen.value.entradas]);
    rows.push(['Total Salidas', corteResumen.value.salidas]);
    rows.push(['Total Retardos', corteResumen.value.retardos]);
    rows.push(['Total Faltas', corteResumen.value.faltas]);
    
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    
    const mesNom = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][corteMes.value - 1];
    link.setAttribute('download', `corte_quincenal_${empName.replace(/\s+/g, '_')}_${mesNom}_Q${corteQuincena.value}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const exportarQuincenalPDF = async () => {
    if (!corteResumen.value || !corteDetalle.value.length) return;
    
    const empName = users.value.find(u => u.id === Number(corteUsuarioId.value))?.name || 'Empleado';
    const mesNom = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][corteMes.value - 1];
    const periodo = `Quincena ${corteQuincena.value} - ${mesNom} ${corteAnio.value}`;

    const doc = new jsPDF();
    
    // Configuración de colores
    const brandColor: [number, number, number] = [16, 185, 129]; // emerald-500
    const textColor = [55, 65, 81];
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.text('Reporte de Asistencia Quincenal', 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Empleado: ${empName}`, 14, 28);
    doc.text(`Periodo: ${periodo}`, 14, 34);

    // Cards (Resumen)
    const metrics = [
        { 
            label: 'DÍAS TRABAJADOS', value: corteResumen.value.dias_trabajados, 
            color: [16, 185, 129], bg: [236, 253, 245], border: [209, 250, 229], textCol: [5, 150, 105], 
            path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' 
        },
        { 
            label: 'ENTRADAS', value: corteResumen.value.entradas, 
            color: [59, 130, 246], bg: [239, 246, 255], border: [219, 234, 254], textCol: [37, 99, 235], 
            path: 'M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h3a3 3 0 013 3v1' 
        },
        { 
            label: 'SALIDAS', value: corteResumen.value.salidas, 
            color: [99, 102, 241], bg: [238, 242, 255], border: [224, 231, 255], textCol: [79, 70, 229], 
            path: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h3a3 3 0 013 3v1' 
        },
        { 
            label: 'RETARDOS', value: corteResumen.value.retardos, 
            color: [245, 158, 11], bg: [255, 251, 235], border: [254, 243, 199], textCol: [217, 119, 6], 
            path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' 
        },
        { 
            label: 'FALTAS', value: corteResumen.value.faltas, 
            color: [239, 68, 68], bg: [254, 242, 242], border: [254, 226, 226], textCol: [220, 38, 38], 
            path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z' 
        }
    ];

    const drawSvgIcon = (svgPath: string, x: number, y: number, size: number) => {
        return new Promise<void>((resolve) => {
            const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="${svgPath}" /></svg>`;
            const img = new Image();
            img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = size * 8;
                canvas.height = size * 8;
                const ctx = canvas.getContext('2d');
                if(ctx) {
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, size, size);
                }
                resolve();
            };
            img.onerror = () => resolve();
        });
    };

    let startX = 14;
    const cardY = 42;
    const cardWidth = 34;
    const cardHeight = 32;

    for (const m of metrics) {
        // Fondo del card
        doc.setFillColor(m.bg[0], m.bg[1], m.bg[2]);
        doc.setDrawColor(m.border[0], m.border[1], m.border[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(startX, cardY, cardWidth, cardHeight, 3, 3, 'FD'); 
        
        // Círculo del icono
        const circleY = cardY + 9;
        const circleX = startX + cardWidth / 2;
        doc.setFillColor(m.color[0], m.color[1], m.color[2]);
        doc.circle(circleX, circleY, 4.5, 'F');
        
        // Ícono SVG (blanco) en el centro del círculo
        await drawSvgIcon(m.path, circleX - 2.5, circleY - 2.5, 5);
        
        // Título del card
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(m.textCol[0], m.textCol[1], m.textCol[2]);
        doc.text(m.label, startX + cardWidth/2, cardY + 20, { align: 'center' });
        
        // Valor del card
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.setTextColor(31, 41, 55); 
        doc.text(m.value.toString(), startX + cardWidth/2, cardY + 28, { align: 'center' });
        
        startX += cardWidth + 4;
    }

    // Restaurar fuente normal para la tabla
    doc.setFont('helvetica', 'normal');

    // Tabla Detallada
    const tableData = corteDetalle.value.map(r => [
        r.fecha.split('-').reverse().join('/'),
        `${r.hora_entrada} - ${r.hora_salida}`,
        r.horaExacta || '—',
        r.horaExactaSalida || '—',
        estadoLabel(r.estadoChecado)
    ]);

    autoTable(doc, {
        startY: cardY + cardHeight + 10,
        head: [['Fecha', 'Horario Teórico', 'Llegada Real', 'Salida Real', 'Estado']],
        body: tableData,
        headStyles: { fillColor: brandColor, textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                const estado = data.cell.raw as string;
                if (estado === 'Puntual' || estado === 'Horas extras') {
                    data.cell.styles.textColor = [16, 185, 129] as [number, number, number];
                } else if (estado === 'Retardo' || estado === 'Sin salida') {
                    data.cell.styles.textColor = [245, 158, 11] as [number, number, number];
                } else if (estado === 'Falta' || estado === 'Regreso') {
                    data.cell.styles.textColor = [239, 68, 68] as [number, number, number];
                }
            }
        }
    });

    doc.save(`corte_quincenal_${empName.replace(/\s+/g, '_')}_${mesNom}_Q${corteQuincena.value}.pdf`);
};
</script>

<style scoped>
@keyframes modal-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to   { opacity: 1; transform: scale(1)    translateY(0); }
}
.animate-modal-in {
    animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
    will-change: transform, opacity;
}
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(156, 163, 175, 0.5);
    border-radius: 9999px;
}
</style>
