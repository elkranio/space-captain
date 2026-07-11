// src/engine/defs/game_location.ts

export const GAME_LOCATION = {
    BRIDGE: 'bridge',
} as const;

export type GameLocation = (typeof GAME_LOCATION)[keyof typeof GAME_LOCATION];
