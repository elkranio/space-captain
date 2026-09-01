// src/engine/content/schemas/ship_drives.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const NON_NEGATIVE_INTEGER_SCHEMA = z.number().int().nonnegative();

const POSITIVE_INTEGER_SCHEMA = z.number().int().positive();

export const SHIP_DRIVE_RECORD_SCHEMA = z
    .strictObject({
        name: z.string().min(1).meta({
            title: "Name",
        }),
        shortName: z.string().min(1).meta({
            title: "Short Name",
        }),

        maxIntegrity: POSITIVE_INTEGER_SCHEMA.meta({
            title: "Max Integrity",
        }),

        evadeWarmupMs: NON_NEGATIVE_INTEGER_SCHEMA.meta({
            title: "Evade Warmup",

            description: "Delay before the ship enters the active Evading window.",

            unit: "ms",
        }),

        evadeDurationMs: POSITIVE_INTEGER_SCHEMA.meta({
            title: "Evade Duration",

            description: "Length of the active Evading window.",

            unit: "ms",
        }),

        evadeCooldownMs: NON_NEGATIVE_INTEGER_SCHEMA.meta({
            title: "Evade Cooldown",

            description: "Full recovery time committed when Evade starts.",

            unit: "ms",
        }),

        evadePowerCost: POSITIVE_INTEGER_SCHEMA.meta({
            title: "Evade Power Cost",

            description: "Power Core charges spent immediately when Evade starts.",

            unit: "charges",
        }),
    })
    .meta({
        title: "Ship Drive",
    });

export const SHIP_DRIVE_TUNING_SCHEMA = z.record(z.string().regex(CONTENT_ID_PATTERN), SHIP_DRIVE_RECORD_SCHEMA).meta({
    title: "Ship Drives",
});

export type ShipDriveTuningData = z.infer<typeof SHIP_DRIVE_TUNING_SCHEMA>;
