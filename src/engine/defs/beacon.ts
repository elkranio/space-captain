// src/engine/defs/beacon.ts
// Стабильные id визуальных вариантов навигационных маяков.
// App-слой мапит эти id на конкретные atlas/frame.
export const BEACON_OBJECT_SPRITE_ID = {
    NAVIGATION_BEACON_00: "navigation_beacon_00",
} as const;

export type BeaconObjectSpriteId = (typeof BEACON_OBJECT_SPRITE_ID)[keyof typeof BEACON_OBJECT_SPRITE_ID];

// Постоянное состояние навигационного маяка во вселенной.
export type NavigationBeaconState = {
    id: string;
    name: string;
    objectSpriteId: BeaconObjectSpriteId;
};
