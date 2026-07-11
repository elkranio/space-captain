// src/engine/defs/ship.ts

export const SHIP_ID = {
    KRELBOID_PIRATE_00: 'krelboid_pirate_00',
} as const;

export type ShipId = (typeof SHIP_ID)[keyof typeof SHIP_ID];

export const SHIP_SPRITE_ID = {
    UNKNOWN_00: 'unknown_00',
    KRELBOID_PIRATE_00: 'krelboid_pirate_00',
} as const;

export type ShipSpriteId = (typeof SHIP_SPRITE_ID)[keyof typeof SHIP_SPRITE_ID];

export type ShipDefinition = {
    id: ShipId;
    name: string;
    spriteId: ShipSpriteId;
};
