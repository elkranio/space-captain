// src/engine/content/schemas/crew_actions.ts

import * as z from "zod";

const CREW_ACTION_TUNING_SCHEMA = z.strictObject({
    durationMs: z.number().int().nonnegative().meta({
        title: "Duration",
        unit: "ms",
        "x-editor-control": "duration",
    }),
});

export const CREW_ACTIONS_SCHEMA = z.strictObject({
    scientist_plot_course: CREW_ACTION_TUNING_SCHEMA,
    scientist_purge_spam: CREW_ACTION_TUNING_SCHEMA,
    clear_sticky_mine: CREW_ACTION_TUNING_SCHEMA,
});

export type CrewActionsData = z.infer<typeof CREW_ACTIONS_SCHEMA>;
