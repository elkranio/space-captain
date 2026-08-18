// src/engine/content/schemas/shield_generators.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const DURATION_SCHEMA = z.number().int().nonnegative();

export const SHIELD_GENERATOR_RECORD_SCHEMA = z
    .strictObject({
        name: z.string().min(1).meta({
            title: "Name",
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
