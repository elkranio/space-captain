import P34TOptions from "../config/p34t.options";

export default class StoreManager {
    private static getKey(key: string): string {
        return `${P34TOptions.prefix}${key}`;
    }

    /**
     * Get raw item from localStorage as a string, or null if not found.
     */
    static getItem(key: string): string | null {
        return localStorage.getItem(this.getKey(key));
    }

    /**
     * Get and parse an item as JSON. Falls back to raw string if not JSON.
     * Example: const save = StoreManager.getParsedItem<{ score: number }>('save1');
     */
    static getParsedItem<T>(key: string): T | string | null {
        const raw = localStorage.getItem(this.getKey(key));
        if (raw === null) return null;

        try {
            return JSON.parse(raw);
        } catch {
            return raw;
        }
    }

    /**
     * Save any primitive or JSON-serializable value.
     */
    static setItem(key: string, value: string | number | boolean | object): void {
        const stored = typeof value === "object" ? JSON.stringify(value) : String(value);
        localStorage.setItem(this.getKey(key), stored);
    }

    /**
     * Return the existing value or initialize it with the default.
     * Example: const vol = StoreManager.initItem<number>('volume', 1.0);
     */
    public static initItem<T extends string | number | boolean>(key: string, defaultValue: T): T {
        const fullKey = this.getKey(key);
        let item = localStorage.getItem(fullKey);

        if (item === null) {
            localStorage.setItem(fullKey, String(defaultValue));
            item = String(defaultValue);
        }

        // Convert string to correct type
        if (typeof defaultValue === "number") return parseFloat(item) as T;
        if (typeof defaultValue === "boolean") return (item === "true") as T;
        return item as T;
    }

    /**
     * Remove a single item from localStorage.
     */
    static removeItem(key: string): void {
        localStorage.removeItem(this.getKey(key));
    }

    /** Nukes all keys prefixed with the app's namespace */
    static clearAll(): void {
        const prefix = P34TOptions.prefix;
        const keysToDelete: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach((key) => localStorage.removeItem(key));
        console.warn(`[StoreManager] Cleared ${keysToDelete.length} keys from localStorage.`);
    }
}
