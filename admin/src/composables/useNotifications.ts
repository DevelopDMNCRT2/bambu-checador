import { ref, computed } from 'vue'
import { authFetch } from '@/utils/api'

// Singleton State (shared across the app)
const notifications = ref<any[]>([])
const hasUnread = ref(false)
// Initialize lastSeen from storage if possible to catch updates across reloads
const storedLastId = localStorage.getItem('last_seen_order_id')
const lastSeenOrderId = ref<number | null>(storedLastId ? parseInt(storedLastId) : null)

const isPolling = ref(false)
let pollingInterval: any = null

export function useNotifications() {

    const fetchNewOrders = async () => {
        try {
            const res = await authFetch('/api/orders?status=new')
            if (res.ok) {
                const orders = await res.json()

                // If no orders at all, nothing to do
                if (orders.length === 0) return

                // Sort descending by ID to find the newest
                orders.sort((a: any, b: any) => b.id - a.id)
                const latestOrder = orders[0]

                // On very first use ever (clean slate), just sync without noise
                if (lastSeenOrderId.value === null) {
                    lastSeenOrderId.value = latestOrder.id
                    localStorage.setItem('last_seen_order_id', latestOrder.id.toString())
                    return
                }

                // Check if there are orders newer than what we last saw
                if (latestOrder.id > lastSeenOrderId.value) {
                    const newOrders = orders.filter((o: any) => o.id > (lastSeenOrderId.value as number))

                    if (newOrders.length > 0) {
                        addNotification(newOrders)
                        // Update tracking
                        lastSeenOrderId.value = latestOrder.id
                        localStorage.setItem('last_seen_order_id', latestOrder.id.toString())
                    }
                }
            }
        } catch (e) {
            console.error("Error polling orders:", e)
        }
    }

    const addNotification = (newOrders: any[]) => {
        const mainOrder = newOrders[0]
        const otherCount = newOrders.length - 1

        let message = `Nueva orden #${mainOrder.id} de ${mainOrder.customerName || 'Cliente'}`
        if (otherCount > 0) {
            message = `${otherCount + 1} nuevas órdenes recibidas`
        }

        const notif = {
            id: Date.now(),
            type: 'Order',
            userImage: '', // Placeholder can be handled in UI or empty
            userName: mainOrder.customerName || 'Sistema',
            action: 'nueva orden',
            project: '',
            message: message,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            details: newOrders,
            read: false
        }

        // Add to list
        notifications.value.unshift(notif)
        hasUnread.value = true

        // Play Sound
        playSound()
    }

    const playSound = () => {
        try {
            const audio = new Audio('/alert.mp3')
            const promise = audio.play()

            if (promise !== undefined) {
                promise.catch(error => {
                    console.warn('Auto-play blocked by browser. Interaction needed.', error)
                    // Optional: Show a quiet toast asking user to enable interaction if critical
                })
            }
        } catch (e) {
            console.error('Error playing notification sound', e)
        }
    }

    const startPolling = () => {
        if (isPolling.value) return
        isPolling.value = true

        // Initial fetch immediately
        fetchNewOrders()

        // Poll every 5 seconds (Standard polling)
        // If "tab throttling" is an issue, a Web Worker would be needed, 
        // but 5s is usually fine.
        pollingInterval = setInterval(fetchNewOrders, 5000)
    }

    const markAsRead = () => {
        hasUnread.value = false
        notifications.value.forEach(n => n.read = true)
    }

    // Get the most recent unread notification for Toasts
    const latestUnread = computed(() => {
        return notifications.value.find(n => !n.read)
    })

    return {
        notifications,
        hasUnread,
        startPolling,
        markAsRead,
        latestUnread
    }
}
