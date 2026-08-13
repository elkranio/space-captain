// src/engine/content/schemas/ship_chassis.ts

import * as z from 'zod';
import {
    SHIP_CHASSIS_ID,
    SHIP_SPRITE_ID,
} from '../../defs/ship_chassis';

export const SHIP_CHASSIS_TUNING_SCHEMA =
    z.strictObject({
        [SHIP_CHASSIS_ID.GENERIC_00]:
            z.strictObject({
                name:
                    z.string()
                        .min(1)
                        .meta({
                            title: 'Name',
                        }),

                spriteId:
                    z.enum(
                        SHIP_SPRITE_ID,
                    ).meta({
                        title:
                            'Sprite',
                    }),

                maxHull:
                    z.number()
                        .int()
                        .positive()
                        .meta({
                            title:
                                'Maximum hull',
                        }),
            }).meta({
                title:
                    'Generic Ship',
            }),
    });

export type ShipChassisTuningData =
    z.infer<
        typeof SHIP_CHASSIS_TUNING_SCHEMA
    >;
