// src/engine/content/catalogs/ship_drives.ts

import {
    SHIP_DRIVE_ID,
    type ShipDriveDefinition,
    type ShipDriveId,
} from '../../defs/ship_drive';

export const SHIP_DRIVES = {
    [SHIP_DRIVE_ID.BASIC_00]: {
        id: SHIP_DRIVE_ID.BASIC_00,
        name: 'BASIC DRIVE',
    },
} satisfies Record<ShipDriveId, ShipDriveDefinition>;
