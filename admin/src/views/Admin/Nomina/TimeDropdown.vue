<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger -->
    <button
      type="button"
      @click="toggleOpen"
      :class="[
        'w-full flex items-center justify-between rounded-xl border bg-white dark:bg-gray-800 text-gray-800 dark:text-white transition-all focus:outline-none',
        compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2.5 text-sm',
        isOpen
          ? 'border-brand-500 ring-1 ring-brand-500'
          : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600',
        !modelValue ? 'text-gray-400 dark:text-gray-500' : ''
      ]"
    >
      <span class="flex items-center gap-1.5">
        <svg :class="compact ? 'w-3 h-3' : 'w-4 h-4'" class="text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        {{ modelValue || placeholder }}
      </span>
      <svg
        :class="['flex-shrink-0 text-gray-400 transition-transform duration-200', isOpen ? 'rotate-180' : '', compact ? 'w-3 h-3' : 'w-4 h-4']"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
      </svg>
    </button>

    <!-- Dropdown -->
    <Teleport to="body">
      <div
        v-if="isOpen"
        ref="dropdownRef"
        class="fixed z-[9999999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
        :style="dropdownStyle"
      >
        <!-- Search -->
        <div class="p-2 border-b border-gray-100 dark:border-gray-700">
          <input
            ref="searchRef"
            v-model="searchQuery"
            type="text"
            placeholder="Buscar hora..."
            class="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white focus:outline-none focus:border-brand-500 placeholder-gray-400"
          />
        </div>
        <!-- Options -->
        <div class="overflow-y-auto max-h-48 custom-scrollbar">
          <button
            v-for="time in filteredTimes"
            :key="time"
            type="button"
            @click="selectTime(time)"
            :class="[
              'w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
              modelValue === time
                ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 font-bold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            ]"
          >
            <span :class="['w-1.5 h-1.5 rounded-full flex-shrink-0', modelValue === time ? 'bg-brand-500' : 'bg-transparent']"></span>
            {{ time }}
          </button>
          <div v-if="filteredTimes.length === 0" class="px-3 py-4 text-center text-xs text-gray-400">
            No se encontraron resultados
          </div>
        </div>
        <!-- Clear -->
        <div v-if="modelValue" class="p-2 border-t border-gray-100 dark:border-gray-700">
          <button
            type="button"
            @click="clearTime"
            class="w-full text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors py-1"
          >
            Limpiar selección
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  compact?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

// ── State ──────────────────────────────────────────────────
const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);
const dropdownStyle = ref<Record<string, string>>({});

// ── Generate time options (every 30 min 00:00 – 23:30) ────
const allTimes = computed<string[]>(() => {
  const times: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }
  }
  return times;
});

const filteredTimes = computed(() => {
  if (!searchQuery.value) return allTimes.value;
  return allTimes.value.filter(t => t.includes(searchQuery.value));
});

// ── Position dropdown ──────────────────────────────────────
const positionDropdown = () => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const spaceBelow = window.innerHeight - rect.bottom;
  const dropHeight = 240;
  const top = spaceBelow >= dropHeight
    ? rect.bottom + 4
    : rect.top - dropHeight - 4;

  dropdownStyle.value = {
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${Math.max(rect.width, 140)}px`,
  };
};

// ── Toggle ─────────────────────────────────────────────────
const toggleOpen = async () => {
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }
  positionDropdown();
  isOpen.value = true;
  await nextTick();
  searchRef.value?.focus();
};

const selectTime = (time: string) => {
  emit('update:modelValue', time);
  isOpen.value = false;
  searchQuery.value = '';
};

const clearTime = () => {
  emit('update:modelValue', '');
  isOpen.value = false;
  searchQuery.value = '';
};

// ── Click outside ─────────────────────────────────────────
const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Node;
  if (
    containerRef.value && !containerRef.value.contains(target) &&
    dropdownRef.value && !dropdownRef.value.contains(target)
  ) {
    isOpen.value = false;
    searchQuery.value = '';
  }
};

watch(isOpen, (val) => {
  if (val) {
    document.addEventListener('mousedown', handleClickOutside);
  } else {
    document.removeEventListener('mousedown', handleClickOutside);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 9999px;
}
</style>
