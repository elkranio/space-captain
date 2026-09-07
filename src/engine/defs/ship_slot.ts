// src/engine/defs/ship_slot.ts

export const SHIP_SLOT_KIND = {
    HULL: "hull",
    BRIDGE: "bridge",
    DRIVE: "drive",
    WEAPON: "weapon",
    DEFENSE: "defense",
    UTILITY: "utility",
} as const;

export type ShipSlotKind = (typeof SHIP_SLOT_KIND)[keyof typeof SHIP_SLOT_KIND];

export const SHIP_SLOT_WIDTH = 100;
export const SHIP_SLOT_HEIGHT = 80;

export type ShipSlotDefinition = {
    id: string;
    kind: ShipSlotKind;

    // Центр slot в канонической chassis-local системе координат.
    // (0, 0) — центр chassis surface; влево/вверх координаты отрицательные.
    // Это authoring geometry, а не экранные координаты dashboard.
    x: number;
    y: number;
};

// Связь физического chassis slot с runtime экземпляром установленного оборудования.
// Hull / Bridge сюда не входят: это target slots, а не mounting points.
// Power Core сюда тоже не входит: он не занимает spatial slot.
export type ShipEquipmentMountState = {
    slotId: string;
    equipmentId: string;
};
