// src/engine/defs/ship_chassis.ts

// Удобные стабильные id встроенного контента.
// Каталог при этом открыт для новых id из content editor.
export const SHIP_CHASSIS_ID = {
    GENERIC_00: 'generic_00',
} as const;

export type ShipChassisId =
    string;

// Удобные стабильные id встроенных визуальных вариантов.
// Новые sprite id создаются Asset Manager и остаются строками.
export const SHIP_SPRITE_ID = {
    UNKNOWN_00: 'unknown_00',
    GENERIC_00: 'generic_00',
} as const;

export type ShipSpriteId =
    string;

// Неизменяемые физические свойства корпуса.
// Установленные системы и оружие задаются ShipPreset.
export type ShipChassisDefinition = {
    id: ShipChassisId;

    name: string;
    spriteId: ShipSpriteId;

    maxHull: number;
};
