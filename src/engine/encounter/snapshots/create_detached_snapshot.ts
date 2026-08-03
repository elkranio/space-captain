// src/engine/encounter/snapshots/create_detached_snapshot.ts

// Encounter state and events contain plain data only.
// Keep one cloning rule for every value crossing the engine read/outbox
// boundary so nested state can never leak into the app layer.
export function createDetachedSnapshot<T>(value: T): T {
    return structuredClone(value);
}
