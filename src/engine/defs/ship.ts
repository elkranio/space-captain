// src\engine\defs\ship.ts
export const SHIP = {
    KRELBOID_PIRATE_00: 'krelboid_pirate_00',
} as const;

export type ShipId = (typeof SHIP)[keyof typeof SHIP];

export const SHIP_SPRITE = {
    UNKNOWN_00: 'unknown_00',
    KRELBOID_PIRATE_00: 'krelboid_pirate_00',
} as const;

export type ShipSprite = (typeof SHIP_SPRITE)[keyof typeof SHIP_SPRITE];

export type ShipDefinition = {
    id: ShipId;
    name: string;
    sprite: ShipSprite;
};
