// src/engine/defs/vector.ts
// Простые сериализуемые векторы engine-слоя.
// Не зависят от Phaser и могут храниться в runtime/save state.

export type Vec2 = {
    x: number;
    y: number;
};

export type Vec3 = {
    x: number;
    y: number;
    z: number;
};
