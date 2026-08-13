// src/engine/content/schemas/ship_drives.ts

import * as z from 'zod';
import {
    SHIP_DRIVE_ID,
} from '../../defs/ship_drive';

export const SHIP_DRIVE_TUNING_SCHEMA =
    z.strictObject({
        [SHIP_DRIVE_ID.BASIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),
            }).meta({
                title:
                    'Basic Drive',
            }),
    });

export type ShipDriveTuningData =
    z.infer<
        typeof SHIP_DRIVE_TUNING_SCHEMA
    >;
