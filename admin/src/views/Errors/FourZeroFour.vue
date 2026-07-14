<template>
  <div class="relative flex flex-col items-center justify-center min-h-screen p-6 bg-white dark:bg-gray-900">
    <!-- Centered Content -->
    <div class="text-center">
      <h1 class="text-9xl font-black text-brand-600 dark:text-brand-500 mb-4">
        404
      </h1>
      
      <p class="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
        Página no encontrada
      </p>
      
      <p class="text-base text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
        Lo sentimos, la página que buscas no existe o ha sido movida.
      </p>

      <router-link
        to="/stats"
        class="inline-flex items-center justify-center rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-brand-700 transition-all active:scale-95"
      >
        Volver al inicio
      </router-link>
    </div>
  </div>
</template>

<script setup>
// No imports needed
</script>
