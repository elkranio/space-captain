// src/engine/defs/ship_slot.ts

export const SHIP_SLOT_KIND = {
    DRIVE: "drive",
    WEAPON: "weapon",
    DEFENSE: "defense",
    UTILITY: "utility",
} as const;

export type ShipSlotKind = (typeof SHIP_SLOT_KIND)[keyof typeof SHIP_SLOT_KIND];

// Первая ось spatial layout зафиксирована дизайном chassis.
// Нумерация идет от кормы к носу; enemy dashboard только зеркалит отображение.
export const SHIP_SLOT_COLUMN_COUNT = 4;

export type ShipSlotDefinition = {
    id: string;
    kind: ShipSlotKind;

    // Каноническая позиция внутри chassis, а не экранные координаты.
    column: number;
    row: number;
};
