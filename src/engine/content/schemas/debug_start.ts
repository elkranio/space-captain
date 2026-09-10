import * as z from "zod";

export const DEBUG_START_SCHEMA = z.strictObject({
    playerShipId: z.string().regex(/^[a-z][a-z0-9_]*$/).meta({
        title: "Player Ship",
        "x-editor-content-reference": ["ships"],
    }),
    enemyShipId: z.string().regex(/^[a-z][a-z0-9_]*$/).meta({
        title: "Enemy Ship",
        "x-editor-content-reference": ["ships"],
    }),
}).meta({ title: "Starting Ships" });

export type DebugStartData = z.infer<typeof DEBUG_START_SCHEMA>;
