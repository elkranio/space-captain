// src/engine/content/schemas/power_cores.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

export const POWER_CORE_RECORD_SCHEMA = z
    .strictObject({
        name: z.string().min(1).meta({
            title: "Name",
        }),
        shortName: z.string().min(1).meta({
            title: "Short Name",
        }),

        capacity: z.number().int().positive().meta({
            title: "Charge capacity",
        }),

        rechargeDurationMs: z.number().int().nonnegative().meta({
            title: "Recharge duration",
            unit: "ms",
            "x-editor-control": "duration",
        }),
    })
    .meta({
        title: "Power Core",
    });

export const POWER_CORE_TUNING_SCHEMA = z.record(z.string().regex(CONTENT_ID_PATTERN), POWER_CORE_RECORD_SCHEMA).meta({
    title: "Power Cores",
});

export type PowerCoreTuningData = z.infer<typeof POWER_CORE_TUNING_SCHEMA>;
