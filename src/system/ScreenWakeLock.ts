import isMobile from 'is-mobile';

/**
 * A static manager for the Screen Wake Lock API.
 * Prevents the screen from dimming or locking.
 */
export default class ScreenWakeLock {
    private static wakeLock: WakeLockSentinel | null = null;

    /**
     * Checks if wake lock is supported **and** should be used on this device.
     * Avoids using it on desktop where it's unnecessary.
     *
     * @returns {boolean} True if supported and appropriate for use.
     */
    public static isSupported(): boolean {
        return isMobile() && 'wakeLock' in navigator;
    }

    /**
     * Requests a screen wake lock to keep the screen from sleeping.
     * Automatically attempts to reacquire the lock if it's released.
     */
    public static async lock(): Promise<void> {
        if (!this.isSupported()) return;

        try {
            this.wakeLock = await navigator.wakeLock.request('screen');

            this.wakeLock.addEventListener('release', () => {
                console.log('[WakeLock] Released. Reacquiring...');
                this.lock().catch(() => {});
            });

            console.log('[WakeLock] Acquired');
        } catch (err) {
            console.warn('[WakeLock] Failed to acquire:', err);
        }
    }

    /**
     * Releases the screen wake lock, if it's active.
     */
    public static async unlock(): Promise<void> {
        if (this.wakeLock) {
            try {
                await this.wakeLock.release();
                this.wakeLock = null;
                console.log('[WakeLock] Released manually');
            } catch (err) {
                console.warn('[WakeLock] Failed to release:', err);
            }
        }
    }
}
