// src/engine/content/schemas/missiles.ts

import * as z from 'zod';
import {
    MISSILE_ID,
} from '../../defs/missile';

const MISSILE_NAME_SCHEMA =
    z.string()
        .min(1)
        .meta({
            title: 'Name',
        });

const DAMAGE_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title: 'Damage',
        });

const FLIGHT_DURATION_SCHEMA =
    z.number()
        .int()
        .nonnegative()
        .meta({
            title:
                'Flight duration',
            unit: 'ms',
            'x-editor-control':
                'duration',
        });

export const MISSILE_TUNING_SCHEMA =
    z.strictObject({
        [MISSILE_ID.BASIC_00]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Basic Missile',
            }),

        [MISSILE_ID.BASIC_01]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Basic Missile II',
            }),
    });

export type MissileTuningData =
    z.infer<
        typeof MISSILE_TUNING_SCHEMA
    >;
