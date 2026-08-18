// src/app/debug/enemy_debug_behaviors_schema.ts

import * as z from "zod";

// Schema lives in the app/debug boundary on purpose.
// Content Editor may edit these development-only switches, but production
// engine content and enemy decision logic must not depend on them.
export const ENEMY_DEBUG_BEHAVIORS_SCHEMA = z.strictObject({
    enemy: z
        .strictObject({
            evadeAtCombatStart: z.boolean().meta({
                title: "Evade at Combat Start",

                description:
                    "Debug only. Force enemy ships to attempt the normal Evade lifecycle when hostile combat begins. This is not enemy AI.",
            }),

            disruptPlayerDriveAtCombatStart: z.boolean().meta({
                title: "Disrupt Player Drive at Combat Start",

                description:
                    "Debug only. Force hostile enemy ships to use their normal one-shot opening disruption pulse when combat begins.",
            }),
        })
        .meta({
            title: "Enemy",
        }),
});

export type EnemyDebugBehaviorsData = z.infer<typeof ENEMY_DEBUG_BEHAVIORS_SCHEMA>;
