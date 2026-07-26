// src/engine/defs/ship.ts

// Стабильные id типов кораблей из контентной базы.
// Runtime-id конкретного корабля в энкаунтере должен быть обычной строкой отдельно.
export const SHIP_ID = {
    GENERIC_00: 'generic_00',
} as const;

export type ShipId = (typeof SHIP_ID)[keyof typeof SHIP_ID];

// Стабильные id визуальных вариантов кораблей.
// App-слой мапит эти id на конкретные atlas/frame.
export const SHIP_SPRITE_ID = {
    UNKNOWN_00: 'unknown_00',
    GENERIC_00: 'generic_00',
} as const;

export type ShipSpriteId = (typeof SHIP_SPRITE_ID)[keyof typeof SHIP_SPRITE_ID];

// Базовое описание типа корабля.
// Боевые статы, фракция, экипаж и runtime-состояние добавляются отдельными моделями.
export type ShipDefinition = {
    id: ShipId;
    name: string;
    spriteId: ShipSpriteId;
};
