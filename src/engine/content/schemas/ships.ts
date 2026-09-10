// src/engine/content/schemas/ships.ts

import * as z from "zod";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;
const CONTENT_ID_SCHEMA = z.string().regex(CONTENT_ID_PATTERN);

const EDITOR_CONTENT_REFERENCE = {
    CHASSIS: ["ship_chassis"],
    DRIVE: ["ship_drives"],
    POWER_CORE: ["power_cores"],
    DEFENSE_TURRET: ["defense_turrets"],
    SHIELD_GENERATOR: ["shield_generators"],
    WEAPON: ["missile_launchers", "beam_cannons", "spam_projectors", "sticky_mine_dispensers"],
} as const;

export const SHIP_EQUIPMENT_TYPE = {
    DRIVE: "drive",
    POWER_CORE: "power_core",
    DEFENSE_TURRET: "defense_turret",
    SHIELD_GENERATOR: "shield_generator",
    WEAPON: "weapon",
} as const;

export type ShipEquipmentType =
    (typeof SHIP_EQUIPMENT_TYPE)[keyof typeof SHIP_EQUIPMENT_TYPE];

const SHIP_EQUIPMENT_SCHEMA = z.discriminatedUnion("type", [
    z.strictObject({
        id: CONTENT_ID_SCHEMA,
        slotId: CONTENT_ID_SCHEMA.meta({ title: "Chassis Slot" }),
        type: z.literal(SHIP_EQUIPMENT_TYPE.DRIVE),
        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Drive",
            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DRIVE,
        }),
    }),
    z.strictObject({
        id: CONTENT_ID_SCHEMA,
        slotId: CONTENT_ID_SCHEMA.meta({ title: "Chassis Slot" }),
        type: z.literal(SHIP_EQUIPMENT_TYPE.POWER_CORE),
        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Power Core",
            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.POWER_CORE,
        }),
    }),
    z.strictObject({
        id: CONTENT_ID_SCHEMA,
        slotId: CONTENT_ID_SCHEMA.meta({ title: "Chassis Slot" }),
        type: z.literal(SHIP_EQUIPMENT_TYPE.DEFENSE_TURRET),
        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Defense Turret",
            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.DEFENSE_TURRET,
        }),
    }),
    z.strictObject({
        id: CONTENT_ID_SCHEMA,
        slotId: CONTENT_ID_SCHEMA.meta({ title: "Chassis Slot" }),
        type: z.literal(SHIP_EQUIPMENT_TYPE.SHIELD_GENERATOR),
        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Shield Generator",
            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.SHIELD_GENERATOR,
        }),
    }),
    z.strictObject({
        id: CONTENT_ID_SCHEMA,
        slotId: CONTENT_ID_SCHEMA.meta({ title: "Chassis Slot" }),
        type: z.literal(SHIP_EQUIPMENT_TYPE.WEAPON),
        equipmentId: CONTENT_ID_SCHEMA.meta({
            title: "Weapon / Utility",
            "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.WEAPON,
        }),
    }),
]);

const SHIP_EQUIPMENT_LIST_SCHEMA = z.array(SHIP_EQUIPMENT_SCHEMA).min(1).superRefine((equipment, context) => {
    const runtimeIds = new Set<string>();
    const slotIds = new Set<string>();
    let driveCount = 0;
    let powerCoreCount = 0;
    let defenseTurretCount = 0;
    let shieldGeneratorCount = 0;

    equipment.forEach((item, index) => {
        if (runtimeIds.has(item.id)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate ship equipment runtime id: ${item.id}`,
                path: [index, "id"],
            });
        }
        runtimeIds.add(item.id);

        if (slotIds.has(item.slotId)) {
            context.addIssue({
                code: "custom",
                message: `Ship chassis slot is mounted more than once: ${item.slotId}`,
                path: [index, "slotId"],
            });
        }
        slotIds.add(item.slotId);

        switch (item.type) {
            case SHIP_EQUIPMENT_TYPE.DRIVE:
                driveCount += 1;
                break;

            case SHIP_EQUIPMENT_TYPE.POWER_CORE:
                powerCoreCount += 1;
                break;

            case SHIP_EQUIPMENT_TYPE.DEFENSE_TURRET:
                defenseTurretCount += 1;
                break;

            case SHIP_EQUIPMENT_TYPE.SHIELD_GENERATOR:
                shieldGeneratorCount += 1;
                break;
        }
    });

    if (driveCount !== 1) {
        context.addIssue({
            code: "custom",
            message: "Ship definition must have exactly one Drive",
        });
    }

    if (powerCoreCount > 1) {
        context.addIssue({
            code: "custom",
            message: "Ship definition cannot have multiple Power Cores",
        });
    }

    if (defenseTurretCount > 1) {
        context.addIssue({
            code: "custom",
            message: "Ship definition cannot have multiple Defense Turrets",
        });
    }

    if (shieldGeneratorCount > 1) {
        context.addIssue({
            code: "custom",
            message: "Ship definition cannot have multiple Shield Generators",
        });
    }
});

export const SHIP_RECORD_SCHEMA = z.strictObject({
    name: z.string().min(1).meta({
        title: "Name",
    }),

    chassisId: CONTENT_ID_SCHEMA.meta({
        title: "Chassis",
        "x-editor-content-reference": EDITOR_CONTENT_REFERENCE.CHASSIS,
    }),

    equipment: SHIP_EQUIPMENT_LIST_SCHEMA.meta({
        title: "Equipment",
        description: "Installed equipment mounted into stable chassis slot ids.",
    }),
});

export const SHIPS_SCHEMA = z.record(CONTENT_ID_SCHEMA, SHIP_RECORD_SCHEMA).meta({
    title: "Ships",
});

export type ShipData = z.infer<typeof SHIP_RECORD_SCHEMA>;
export type ShipsData = z.infer<typeof SHIPS_SCHEMA>;
