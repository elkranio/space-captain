// src/engine/content/schemas/debug_start.ts

import * as z from "zod";

const CONTENT_ID_SCHEMA = z.string().min(1);

// Editor-only hints live as schema metadata.
// Runtime validation remains normal content-id validation.
const EDITOR_CONTENT_REFERENCE = {
    CHASSIS: ["ship_chassis"],

    DRIVE: ["ship_drives"],

    POWER_CORE: ["power_cores"],

    SHIELD_GENERATOR: ["shield_generators"],

    DEFENSE_TURRET: ["defense_turrets"],

    WEAPON: ["missile_launchers", "beam_cannons", "spam_projectors", "sticky_mine_dispensers"],
} as const;

export const DEBUG_START_EQUIPMENT_TYPE = {
    DRIVE: "drive",
    DEFENSE_TURRET: "defense_turret",
    SHIELD_GENERATOR: "shield_generator",
    WEAPON: "weapon",
} as const;

export type DebugStartEquipmentType =
    (typeof DEBUG_START_EQUIPMENT_TYPE)[keyof typeof DEBUG_START_EQUIPMENT_TYPE];

const DEBUG_START_EQUIPMENT_SCHEMA = z.discriminatedUnion("type", [
    z.strictObject({
        slotId: CONTENT_ID_SCHEMA.meta({
            title: "Chassis Slot",
        }),

        type: z.literal(DEBUG_START_EQUIPMENT_TYPE.DRIVE),

        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Drive",

            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DRIVE,
        }),
    }),

    z.strictObject({
        slotId: CONTENT_ID_SCHEMA.meta({
            title: "Chassis Slot",
        }),

        type: z.literal(DEBUG_START_EQUIPMENT_TYPE.DEFENSE_TURRET),

        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Defense Turret",

            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DEFENSE_TURRET,
        }),
    }),

    z.strictObject({
        slotId: CONTENT_ID_SCHEMA.meta({
            title: "Chassis Slot",
        }),

        type: z.literal(DEBUG_START_EQUIPMENT_TYPE.SHIELD_GENERATOR),

        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Shield Generator",

            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.SHIELD_GENERATOR,
        }),
    }),

    z.strictObject({
        slotId: CONTENT_ID_SCHEMA.meta({
            title: "Chassis Slot",
        }),

        type: z.literal(DEBUG_START_EQUIPMENT_TYPE.WEAPON),

        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Weapon / Utility",

            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.WEAPON,
        }),
    }),
]);

export const DEBUG_START_SCHEMA = z.strictObject({
    player: z
        .strictObject({
            chassisId: CONTENT_ID_SCHEMA.meta({
                title: "Chassis",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.CHASSIS,
            }),

            powerCoreId: CONTENT_ID_SCHEMA.meta({
                title: "Power Core",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.POWER_CORE,
            }),

            equipment: z.array(DEBUG_START_EQUIPMENT_SCHEMA).min(1).meta({
                title: "Equipment",

                description:
                    "Spatial equipment mounted into stable chassis slot ids. " +
                    "Power Core is configured separately because it is not a spatial slot.",
            }),
        })
        .meta({
            title: "Player Ship",
        }),

    enemy: z
        .strictObject({
            chassisId: CONTENT_ID_SCHEMA.meta({
                title: "Chassis",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.CHASSIS,
            }),

            powerCoreId: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Power Core",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.POWER_CORE,
            }),

            equipment: z.array(DEBUG_START_EQUIPMENT_SCHEMA).min(1).meta({
                title: "Equipment",

                description:
                    "Spatial equipment mounted into stable chassis slot ids. " +
                    "Power Core is configured separately because it is not a spatial slot.",
            }),
        })
        .meta({
            title: "Enemy Ship",
        }),
});

export type DebugStartData = z.infer<typeof DEBUG_START_SCHEMA>;
