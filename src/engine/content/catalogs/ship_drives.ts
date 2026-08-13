// src/engine/content/catalogs/ship_drives.ts

import shipDriveTuningData from '../data/ship_drives.json';
import {
    SHIP_DRIVE_TUNING_SCHEMA,
} from '../schemas/ship_drives';
import {
    SHIP_DRIVE_ID,
    type ShipDriveDefinition,
    type ShipDriveId,
} from '../../defs/ship_drive';

const SHIP_DRIVE_TUNING =
    SHIP_DRIVE_TUNING_SCHEMA.parse(
        shipDriveTuningData,
    );

export const SHIP_DRIVES = {
    [SHIP_DRIVE_ID.BASIC_00]: {
        id:
            SHIP_DRIVE_ID.BASIC_00,

        ...SHIP_DRIVE_TUNING[
            SHIP_DRIVE_ID.BASIC_00
        ],
    },
} satisfies Record<
    ShipDriveId,
    ShipDriveDefinition
>;
