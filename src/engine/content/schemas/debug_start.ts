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

const WEAPON_SLOT_META = {
    description: "Installed weapon. Runtime installation ids are generated automatically.",

    "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.WEAPON,
} as const;

export const DEBUG_START_SCHEMA = z.strictObject({
    player: z
        .strictObject({
            maxHull: z.number().int().positive().meta({
                title: "Max Hull",
            }),

            driveId: CONTENT_ID_SCHEMA.meta({
                title: "Drive",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DRIVE,
            }),

            powerCoreId: CONTENT_ID_SCHEMA.meta({
                title: "Power Core",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.POWER_CORE,
            }),

            shieldGeneratorId: CONTENT_ID_SCHEMA.meta({
                title: "Shield Generator",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.SHIELD_GENERATOR,
            }),

            defenseTurretId: CONTENT_ID_SCHEMA.meta({
                title: "Defense Turret",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DEFENSE_TURRET,
            }),

            weaponSlot1Id: CONTENT_ID_SCHEMA.meta({
                title: "Weapon Slot 1",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot2Id: CONTENT_ID_SCHEMA.meta({
                title: "Weapon Slot 2",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot3Id: CONTENT_ID_SCHEMA.meta({
                title: "Weapon Slot 3",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot4Id: CONTENT_ID_SCHEMA.meta({
                title: "Weapon Slot 4",

                ...WEAPON_SLOT_META,
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

            driveId: CONTENT_ID_SCHEMA.meta({
                title: "Drive",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DRIVE,
            }),

            powerCoreId: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Power Core",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.POWER_CORE,
            }),

            shieldGeneratorId: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Shield Generator",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.SHIELD_GENERATOR,
            }),

            defenseTurretId: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Defense Turret",

                "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DEFENSE_TURRET,
            }),

            weaponSlot1Id: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Weapon Slot 1",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot2Id: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Weapon Slot 2",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot3Id: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Weapon Slot 3",

                ...WEAPON_SLOT_META,
            }),

            weaponSlot4Id: CONTENT_ID_SCHEMA.nullable().meta({
                title: "Weapon Slot 4",

                ...WEAPON_SLOT_META,
            }),
        })
        .meta({
            title: "Enemy Ship",
        }),
});

export type DebugStartData = z.infer<typeof DEBUG_START_SCHEMA>;
