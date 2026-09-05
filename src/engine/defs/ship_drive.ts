// src/engine/defs/ship_drive.ts

import { SHIP_SLOT_KIND } from "./ship_slot";

// Удобный стабильный id встроенного drive.
// Каталог открыт для новых module ids из content editor.
export const SHIP_DRIVE_ID = {
    BASIC_00: "basic_00",
} as const;

export type ShipDriveDefinition = {
    id: string;
    name: string;
    shortName: string;

    slotKind: typeof SHIP_SLOT_KIND.DRIVE;

    maxIntegrity: number;

    evadeWarmupMs: number;
    evadeDurationMs: number;
    evadeCooldownMs: number;
    evadePowerCost: number;
};

export type ShipDriveState = {
    // Runtime id установленного экземпляра.
    id: string;

    // Ссылка на неизменяемое content definition.
    driveId: string;
};
