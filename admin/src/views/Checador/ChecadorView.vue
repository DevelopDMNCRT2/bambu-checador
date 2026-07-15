<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center py-10 px-4">
    <div class="w-full max-w-lg space-y-6">
      
      <!-- Logo o Título -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 dark:text-white">Checador</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Registro de Asistencia</p>
      </div>

      <!-- Estado: Confirmar Vinculación -->
      <div v-if="showVincularConfirm" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-brand-100 dark:border-brand-900/30 p-8 text-center space-y-6">
        <div class="w-16 h-16 bg-brand-50 dark:bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-brand-500 animate-bounce">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">Registrar Dispositivo</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Para poder registrar tu asistencia desde este celular, primero debes vincularlo como tu dispositivo oficial.
        </p>
        <button
          class="w-full py-4 px-6 rounded-xl text-lg font-bold transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-brand-500 hover:bg-brand-600 focus:ring-brand-500 text-white"
          :disabled="vinculando"
          @click="confirmarVinculacion"
        >
          <span v-if="vinculando">Registrando...</span>
          <span v-else>Vincular este Celular</span>
        </button>
      </div>

      <!-- Estado: Vinculando -->
      <div v-else-if="vinculando" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center">
        <svg class="animate-spin h-8 w-8 text-brand-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p class="text-gray-600 dark:text-gray-300 font-medium">Vinculando dispositivo...</p>
      </div>

      <!-- Estado: No Registrado -->
      <div v-else-if="!usuarioIdentificado" class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 p-8 text-center space-y-4">
        <div class="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-red-500">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white">Dispositivo no registrado</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Este dispositivo no está vinculado a ningún empleado. Pide a tu administrador que te genere un enlace de vinculación e ingresa desde ahí.
        </p>
      </div>

      <!-- Estado: Listo (Panel Principal) -->
      <div v-else>
        <!-- Tarjeta de Bienvenida -->
        <div class="bg-brand-500 rounded-t-2xl p-6 text-center text-white shadow-md relative overflow-hidden">
          <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10 blur-2xl"></div>
          <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 rounded-full bg-white opacity-10 blur-xl"></div>
          
          <h2 class="text-xl font-bold relative z-10">Hola, {{ usuarioIdentificado.name }}</h2>
          <span class="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm relative z-10">
            {{ usuarioIdentificado.role }}
          </span>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-b-2xl shadow-sm border border-t-0 border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="p-8 text-center space-y-6">
            
            <!-- Reloj Digital -->
            <div class="text-5xl md:text-6xl font-mono font-bold text-gray-800 dark:text-white tracking-wider tabular-nums">
              {{ currentTime }}
            </div>
            <div class="text-brand-600 dark:text-brand-400 font-medium text-lg capitalize">
              {{ currentDate }}
            </div>

            <!-- Botones de Acción -->
            <div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <button
                class="flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white"
                :disabled="loading"
                @click="registrar('Entrada')"
              >
                Checar Entrada
              </button>
              <button
                class="flex-1 py-4 px-6 rounded-xl text-lg font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white"
                :disabled="loading"
                @click="registrar('Salida')"
              >
                Checar Salida
              </button>
            </div>

            <!-- Mensajes -->
            <div v-if="errorMsg" class="mt-4 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium border border-red-100 dark:border-red-900/30 text-left flex items-start gap-3">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
            <div v-if="successMsg" class="mt-4 p-4 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-sm font-medium border border-green-100 dark:border-green-900/30 text-left flex items-start gap-3">
              <svg class="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{{ successMsg }}</span>
            </div>
            <div v-if="loading" class="mt-4 text-brand-500 text-sm font-medium animate-pulse flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Procesando...
            </div>

          </div>
        </div>

        <!-- Historial del día / Recientes -->
        <div class="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
            <h3 class="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-wider">Historial Reciente</h3>
          </div>
          <div class="p-0">
            <table class="w-full text-sm text-left">
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700/50">
                <tr v-if="historial.length === 0">
                  <td colspan="2" class="px-6 py-8 text-center text-gray-400 text-sm">
                    No has registrado asistencia recientemente
                  </td>
                </tr>
                <tr v-for="item in historial" :key="item.id" class="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <span :class="[
                        'w-2 h-2 rounded-full',
                        item.tipo === 'Entrada' ? 'bg-green-500' : 'bg-red-500'
                      ]"></span>
                      <span class="font-bold text-gray-800 dark:text-white">{{ item.tipo }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right text-gray-500 dark:text-gray-400 font-mono text-xs">
                    {{ formatFechaHora(item.fecha_hora) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { API_URL } from '@/utils/api';

const API_BASE = '/api/checador';

const route = useRoute();
const router = useRouter();

const currentTime = ref('');
const currentDate = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const loading = ref(false);
const vinculando = ref(false);

const usuarioIdentificado = ref<any>(null);
const historial = ref<any[]>([]);
const showVincularConfirm = ref(false);

const confirmarVinculacion = () => {
  const linkToken = route.query.link_token as string;
  const deviceToken = getDeviceToken();
  if (linkToken) {
    vincularDispositivo(linkToken, deviceToken);
  }
};

let clockInterval: any;

// Genera o recupera el token único del dispositivo
const getDeviceToken = () => {
  let token = localStorage.getItem('bambu_device_token');
  if (!token) {
    token = 'dev_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      token = crypto.randomUUID();
    }
    localStorage.setItem('bambu_device_token', token);
  }
  return token;
};

const updateClock = () => {
  const now = new Date();
  currentTime.value = now.toLocaleTimeString('es-MX', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  currentDate.value = now.toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
};

const formatFechaHora = (fh: string) => {
  if (!fh) return '';
  const [d, t] = fh.split(' ');
  return `${d.split('-').reverse().join('/')} a las ${t}`;
};

const fetchHistorial = async (deviceToken: string) => {
  try {
    const res = await fetch(`${API_URL}${API_BASE}/historial?deviceToken=${deviceToken}`);
    if (res.ok) {
      historial.value = await res.json();
    }
  } catch (err) {
    console.error('Error al obtener historial', err);
  }
};

const identificarUsuario = async (deviceToken: string) => {
  try {
    const res = await fetch(`${API_URL}${API_BASE}/identificar?deviceToken=${deviceToken}`);
    if (res.ok) {
      const data = await res.json();
      usuarioIdentificado.value = data.usuario;
      fetchHistorial(deviceToken);
    } else {
      usuarioIdentificado.value = null;
    }
  } catch (err) {
    console.error('Error al identificar', err);
  }
};

const vincularDispositivo = async (linkToken: string, deviceToken: string) => {
  vinculando.value = true;
  try {
    const res = await fetch(`${API_URL}${API_BASE}/vincular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkToken, deviceToken })
    });
    const data = await res.json();
    if (res.ok) {
      showVincularConfirm.value = false;
      // Limpiar el token de la URL para evitar reenvíos
      router.replace({ path: '/checador' });
      await identificarUsuario(deviceToken);
    } else {
      alert(data.error || 'El enlace de vinculación es inválido o ha expirado.');
    }
  } catch (err) {
    alert('Error de conexión al vincular el dispositivo.');
  } finally {
    vinculando.value = false;
  }
};

const registrar = async (tipo: 'Entrada' | 'Salida') => {
  errorMsg.value = '';
  successMsg.value = '';
  
  if (!navigator.geolocation) {
    errorMsg.value = 'Tu navegador no soporta geolocalización. Intenta en otro dispositivo.';
    return;
  }

  loading.value = true;
  const deviceToken = getDeviceToken();
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`${API_URL}${API_BASE}/registro`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo, latitud: latitude, longitud: longitude, deviceToken })
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Error desconocido al registrar');
        }

        successMsg.value = `¡${tipo} registrada con éxito a las ${data.fecha_hora.split(' ')[1]}!`;
        fetchHistorial(deviceToken);
      } catch (err: any) {
        errorMsg.value = err.message || 'Error al conectar con el servidor';
      } finally {
        loading.value = false;
      }
    },
    (err) => {
      loading.value = false;
      if (err.code === err.PERMISSION_DENIED) {
        errorMsg.value = 'Debes permitir el acceso a la ubicación (GPS) para poder checar.';
      } else {
        errorMsg.value = `Error obteniendo ubicación: ${err.message}`;
      }
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
};

onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);

  const deviceToken = getDeviceToken();
  const linkToken = route.query.link_token as string;

  if (linkToken) {
    showVincularConfirm.value = true;
  } else {
    identificarUsuario(deviceToken);
  }

  // Solicitar permiso de ubicación inmediatamente al entrar
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      () => {},
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          errorMsg.value = 'Debes permitir el acceso a la ubicación (GPS) para poder checar.';
        }
      },
      { enableHighAccuracy: true }
    );
  }
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval);
});
</script>
