// src/engine/generation/utils/random_from.ts
export function randomFrom<T>(items: readonly T[]): T {
    if (items.length === 0) {
        throw new Error('Cannot pick random item from empty pool.');
    }

    return items[Math.floor(Math.random() * items.length)];
}
