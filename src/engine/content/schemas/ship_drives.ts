// src/engine/content/schemas/ship_drives.ts

import * as z from 'zod';

const CONTENT_ID_PATTERN =
    /^[a-z][a-z0-9_]*$/;

const NON_NEGATIVE_INTEGER_SCHEMA =
    z.number()
        .int()
        .nonnegative();

const POSITIVE_INTEGER_SCHEMA =
    z.number()
        .int()
        .positive();

export const SHIP_DRIVE_RECORD_SCHEMA =
    z.strictObject({
        name:
            z.string()
                .min(1)
                .meta({
                    title: 'Name',
                }),

        evadeWarmupMs:
            NON_NEGATIVE_INTEGER_SCHEMA,

        evadeDurationMs:
            POSITIVE_INTEGER_SCHEMA,

        evadeCooldownMs:
            NON_NEGATIVE_INTEGER_SCHEMA,

        evadePowerCost:
            POSITIVE_INTEGER_SCHEMA,
    }).meta({
        title:
            'Ship Drive',
    });

export const SHIP_DRIVE_TUNING_SCHEMA =
    z.record(
        z.string()
            .regex(
                CONTENT_ID_PATTERN,
            ),
        SHIP_DRIVE_RECORD_SCHEMA,
    ).meta({
        title:
            'Ship Drives',
    });

export type ShipDriveTuningData =
    z.infer<
        typeof SHIP_DRIVE_TUNING_SCHEMA
    >;
