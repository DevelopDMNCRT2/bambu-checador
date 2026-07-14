<template>
  <div class="min-h-screen">
    <app-sidebar v-if="!hideSidebar" />
    <Backdrop v-if="!hideSidebar" />
    <div
      class="flex-1 transition-all duration-300 ease-in-out"
      :class="[!hideSidebar ? (isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]') : '']"
    >
      <app-header />
      <div class="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
        <slot></slot>
      </div>
    </div>
    <!-- Global Notification Toast -->
    <ToastNotification />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import ToastNotification from '@/components/common/ToastNotification.vue'
import Backdrop from './Backdrop.vue'
import { useSidebar } from '@/composables/useSidebar'
import { useNotifications } from '@/composables/useNotifications'

const props = defineProps({
  hideSidebar: {
    type: Boolean,
    default: false
  }
})

const { isExpanded, isHovered } = useSidebar()
const { startPolling } = useNotifications()

onMounted(() => {
    startPolling()
})
</script>
