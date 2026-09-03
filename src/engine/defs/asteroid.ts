// src/engine/defs/asteroid.ts
// Стабильные id визуальных вариантов астероидов.
// App-слой мапит эти id на конкретные atlas/frame.
export const ASTEROID_OBJECT_SPRITE_ID = {
    ASTEROID: "asteroid",
} as const;

export type AsteroidObjectSpriteId = (typeof ASTEROID_OBJECT_SPRITE_ID)[keyof typeof ASTEROID_OBJECT_SPRITE_ID];

// Постоянное состояние астероида во вселенной.
export type AsteroidState = {
    id: string;
    name: string;
    objectSpriteId: AsteroidObjectSpriteId;
};
