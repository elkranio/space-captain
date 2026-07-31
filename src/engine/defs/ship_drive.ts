// src/engine/defs/ship_drive.ts

export const SHIP_DRIVE_ID = {
    BASIC_00: 'basic_00',
} as const;

export type ShipDriveId =
    (typeof SHIP_DRIVE_ID)[keyof typeof SHIP_DRIVE_ID];

export const SHIP_DRIVE_STATUS = {
    ONLINE: 'online',
    DISABLED: 'disabled',
} as const;

export type ShipDriveStatus =
    (typeof SHIP_DRIVE_STATUS)[keyof typeof SHIP_DRIVE_STATUS];

export type ShipDriveDefinition = {
    id: ShipDriveId;
    name: string;
};

export type ShipDriveState = {
    // Runtime id установленного экземпляра.
    id: string;

    // Ссылка на неизменяемое content definition.
    driveId: ShipDriveId;

    status: ShipDriveStatus;
};
