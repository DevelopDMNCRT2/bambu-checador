<template>
  <div v-if="isLocked" class="fixed inset-0 z-[99999] h-screen w-screen overflow-hidden flex flex-col items-center justify-center bg-brand-500 text-white">
    <div class="w-full max-w-sm p-8 text-center bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/20">
      <div class="mb-6">
        <h2 class="text-2xl font-bold">Bloqueado</h2>
        <p class="mt-2 text-white/80">Hola {{ userName }}, ingresa tu PIN para continuar</p>
      </div>

      <form @submit.prevent="unlock" class="space-y-6">
        <div>
          <!-- Readonly to prevent native keyboard on mobile/tablet -->
          <input
            ref="pinInput"
            :value="pin"
            type="password"
            maxlength="4"
            readonly
            class="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] text-gray-900 placeholder-transparent bg-white rounded-lg focus:outline-none focus:ring-4 focus:ring-white/30 pointer-events-none"
            placeholder="0000"
          />
        </div>

        <!-- Numeric Keypad -->
        <div class="grid grid-cols-3 gap-6 mb-6 justify-items-center">
            <button
                v-for="digit in ['1', '2', '3', '4', '5', '6', '7', '8', '9']"
                :key="digit"
                type="button"
                @click="appendDigit(digit)"
                class="w-16 h-16 text-2xl font-bold text-white transition bg-white/20 rounded-full hover:bg-white/30 active:bg-white/40 shadow-sm border border-white/10 flex items-center justify-center"
            >
                {{ digit }}
            </button>
            <div class="w-16 h-16"></div> <!-- Spacer -->
            <button
                type="button"
                @click="appendDigit('0')"
                class="w-16 h-16 text-2xl font-bold text-white transition bg-white/20 rounded-full hover:bg-white/30 active:bg-white/40 shadow-sm border border-white/10 flex items-center justify-center"
            >
                0
            </button>
             <button
                type="button"
                @click="deleteDigit"
                class="w-16 h-16 text-2xl font-bold text-white transition bg-white/10 rounded-full hover:bg-red-500/30 active:bg-red-500/50 shadow-sm border border-white/10 flex items-center justify-center"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
            </button>
        </div>
      </form>

      <div class="mt-8">
        <button
          @click="logout"
          class="text-sm font-medium text-white/70 hover:text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition"
        >
            Cerrar Sesión
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
    isLocked: boolean
}>();

const emit = defineEmits(['unlock']);

const router = useRouter();
const pin = ref('');
const pinInput = ref<HTMLInputElement | null>(null);

const user = computed(() => {
    try {
        return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
        return {};
    }
});

const userName = computed(() => user.value.name || 'Usuario');

watch(() => props.isLocked, (newVal) => {
    if (newVal) {
        pin.value = '';
    }
});

const appendDigit = (digit: string) => {
    if (pin.value.length < 4) {
        pin.value += digit;
        
         if (pin.value.length === 4) {
             // Auto unlock attempt
             setTimeout(() => {
                unlock();
             }, 100);
         }
    }
};

const deleteDigit = () => {
    pin.value = pin.value.slice(0, -1);
};

const unlock = () => {
    if (pin.value === user.value.pin) {
        emit('unlock');
    } else {
        alert('PIN Incorrecto');
        pin.value = '';
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    emit('unlock'); 
    router.push('/login');
};
</script>
