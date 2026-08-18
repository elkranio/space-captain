// src/engine/defs/game_location.ts

// Стабильные id крупных игровых локаций, которые можно хранить в сейве.
// App-слой мапит эти id на конкретные Phaser scenes.
export const GAME_LOCATION_ID = {
    BRIDGE: "bridge",
} as const;

export type GameLocationId = (typeof GAME_LOCATION_ID)[keyof typeof GAME_LOCATION_ID];
