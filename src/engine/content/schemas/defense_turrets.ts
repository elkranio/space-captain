// src/engine/content/schemas/defense_turrets.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const DURATION_SCHEMA = z.number().int().nonnegative();
const MAX_INTEGRITY_SCHEMA = z.number().int().positive();

export const DEFENSE_TURRET_RECORD_SCHEMA = z
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

        loadDurationMs: DURATION_SCHEMA.meta({
            title: "Load duration",
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
        title: "Defense Turret",
    });

export const DEFENSE_TURRET_TUNING_SCHEMA = z
    .record(z.string().regex(CONTENT_ID_PATTERN), DEFENSE_TURRET_RECORD_SCHEMA)
    .meta({
        title: "Defense Turrets",
    });

export type DefenseTurretTuningData = z.infer<typeof DEFENSE_TURRET_TUNING_SCHEMA>;
