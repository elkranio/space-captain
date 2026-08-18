// src/engine/content/catalogs/ship_drives.ts

import shipDriveTuningData from "../data/ship_drives.json";
import { SHIP_DRIVE_TUNING_SCHEMA } from "../schemas/ship_drives";
import { type ShipDriveDefinition } from "../../defs/ship_drive";

const SHIP_DRIVE_TUNING = SHIP_DRIVE_TUNING_SCHEMA.parse(shipDriveTuningData);

export const SHIP_DRIVES = Object.fromEntries(
    Object.entries(SHIP_DRIVE_TUNING).map(([id, tuning]) => {
        return [
            id,
            {
                id,
                ...tuning,
            },
        ];
    }),
) as Record<string, ShipDriveDefinition>;
