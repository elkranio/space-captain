// src/engine/content/schemas/shield_generators.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const DURATION_SCHEMA = z.number().int().nonnegative();
const MAX_INTEGRITY_SCHEMA = z.number().int().positive();

export const SHIELD_GENERATOR_RECORD_SCHEMA = z
    .strictObject({
        name: z.string().min(1).meta({
            title: "Name",
        }),
        shortName: z.string().min(1).meta({
            title: "Short Name",
        }),

        maxIntegrity: MAX_INTEGRITY_SCHEMA.meta({
            title: "Max Integrity",
        }),

        shieldDurationMs: DURATION_SCHEMA.meta({
            title: "Shield duration",
            unit: "ms",
            "x-editor-control": "duration",
        }),

        cooldownDurationMs: DURATION_SCHEMA.meta({
            title: "Cooldown duration",
            unit: "ms",
            "x-editor-control": "duration",
        }),
    })
    .meta({
        title: "Shield Generator",
    });

export const SHIELD_GENERATOR_TUNING_SCHEMA = z
    .record(z.string().regex(CONTENT_ID_PATTERN), SHIELD_GENERATOR_RECORD_SCHEMA)
    .meta({
        title: "Shield Generators",
    });

export type ShieldGeneratorTuningData = z.infer<typeof SHIELD_GENERATOR_TUNING_SCHEMA>;
