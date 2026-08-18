// src/engine/defs/asteroid.ts
// Стабильные id визуальных вариантов астероидов.
// App-слой мапит эти id на конкретные atlas/frame.
export const ASTEROID_OBJECT_SPRITE_ID = {
    ASTEROID_00: "asteroid_00",
} as const;

export type AsteroidObjectSpriteId = (typeof ASTEROID_OBJECT_SPRITE_ID)[keyof typeof ASTEROID_OBJECT_SPRITE_ID];

// Постоянное состояние астероида во вселенной.
export type AsteroidState = {
    id: string;
    name: string;
    objectSpriteId: AsteroidObjectSpriteId;
};
