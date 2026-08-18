// src/engine/defs/ship_drive.ts

// Удобный стабильный id встроенного drive.
// Каталог открыт для новых module ids из content editor.
export const SHIP_DRIVE_ID = {
    BASIC_00: "basic_00",
} as const;

export const SHIP_DRIVE_STATUS = {
    ONLINE: "online",
    DISABLED: "disabled",
} as const;

export type ShipDriveStatus = (typeof SHIP_DRIVE_STATUS)[keyof typeof SHIP_DRIVE_STATUS];

export type ShipDriveDefinition = {
    id: string;
    name: string;

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

    status: ShipDriveStatus;
};
