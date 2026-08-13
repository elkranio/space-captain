// src/engine/content/schemas/ship_chassis.ts

import * as z from 'zod';

const CONTENT_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

export const SHIP_CHASSIS_RECORD_SCHEMA =
    z.strictObject({
        name:
            z.string()
                .min(1)
                .meta({
                    title: 'Name',
                }),

        spriteId:
            z.string()
                .regex(
                    CONTENT_ID_PATTERN,
                )
                .meta({
                    title:
                        'Sprite',

                    'x-editor-asset-bucket':
                        'ship_chassis',
                }),

        maxHull:
            z.number()
                .int()
                .min(1)
                .meta({
                    title:
                        'Maximum hull',
                }),
    }).meta({
        title:
            'Ship Chassis',
    });

export const SHIP_CHASSIS_TUNING_SCHEMA =
    z.record(
        z.string()
            .regex(
                CONTENT_ID_PATTERN,
            ),
        SHIP_CHASSIS_RECORD_SCHEMA,
    ).meta({
        title:
            'Ship Chassis',
    });

export type ShipChassisTuningData =
    z.infer<
        typeof SHIP_CHASSIS_TUNING_SCHEMA
    >;
