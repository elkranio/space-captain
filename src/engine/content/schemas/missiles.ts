// src/engine/content/schemas/missiles.ts

import * as z from 'zod';
import {
    MISSILE_ID,
    MISSILE_SPECTRAL_BAND,
} from '../../defs/missile';

const MISSILE_NAME_SCHEMA =
    z.string()
        .min(1)
        .meta({
            title: 'Name',
        });

const SPECTRAL_BAND_SCHEMA =
    z.enum(
        MISSILE_SPECTRAL_BAND,
    ).meta({
        title:
            'Spectral band',
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
        [MISSILE_ID.RED_00]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                spectralBand:
                    SPECTRAL_BAND_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Red-band Missile',
            }),

        [MISSILE_ID.BLUE_00]:
            z.strictObject({
                name:
                    MISSILE_NAME_SCHEMA,

                spectralBand:
                    SPECTRAL_BAND_SCHEMA,

                damage:
                    DAMAGE_SCHEMA,

                flightDurationMs:
                    FLIGHT_DURATION_SCHEMA,
            }).meta({
                title:
                    'Blue-band Missile',
            }),
    });

export type MissileTuningData =
    z.infer<
        typeof MISSILE_TUNING_SCHEMA
    >;
