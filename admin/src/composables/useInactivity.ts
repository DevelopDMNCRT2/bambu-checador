import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

export function useInactivity() {
    const isLocked = ref(false);
    const router = useRouter();
    let timer: ReturnType<typeof setTimeout> | undefined;

    // Time in milliseconds (1 minute)
    const TIMEOUT = 60 * 1000;

    const resetTimer = () => {
        if (isLocked.value) return;

        clearTimeout(timer);

        // Inactivity lock disabled for 'Operativo' user as per request.
        // Logic removed.
    };

    const lockScreen = () => {
        isLocked.value = true;
    };

    const unlockScreen = () => {
        isLocked.value = false;
        resetTimer();
    };

    const setupListeners = () => {
        if (typeof window === 'undefined') return;

        ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Initial start
        resetTimer();
    };

    const cleanupListeners = () => {
        if (typeof window === 'undefined') return;

        ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'].forEach(event => {
            window.removeEventListener(event, resetTimer);
        });
        clearTimeout(timer);
    };

    onMounted(() => {
        setupListeners();
    });

    onUnmounted(() => {
        cleanupListeners();
    });

    return {
        isLocked,
        unlockScreen
    };
}
