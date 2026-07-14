<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
      <LockScreen :isLocked="isLocked" @unlock="unlockScreen" />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import LockScreen from './components/common/LockScreen.vue'
import { useInactivity } from './composables/useInactivity'

const { isLocked, unlockScreen } = useInactivity()
</script>
