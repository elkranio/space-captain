// src/engine/content/schemas/ship_chassis.ts

import * as z from "zod";
import { SHIP_SLOT_COLUMN_COUNT, SHIP_SLOT_KIND } from "../../defs/ship_slot";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const SHIP_SLOT_KIND_SCHEMA = z.union([
    z.literal(SHIP_SLOT_KIND.DRIVE),
    z.literal(SHIP_SLOT_KIND.WEAPON),
    z.literal(SHIP_SLOT_KIND.DEFENSE),
    z.literal(SHIP_SLOT_KIND.UTILITY),
]);

const SHIP_SLOT_SCHEMA = z.strictObject({
    id: z.string().regex(CONTENT_ID_PATTERN),
    kind: SHIP_SLOT_KIND_SCHEMA,
    column: z.number().int().min(1).max(SHIP_SLOT_COLUMN_COUNT),
    row: z.number().int().min(1),
});

const SHIP_SLOTS_SCHEMA = z.array(SHIP_SLOT_SCHEMA).min(1).superRefine((slots, context) => {
    const slotIds = new Set<string>();
    const occupiedPositions = new Set<string>();
    let driveCount = 0;

    slots.forEach((slot, index) => {
        if (slotIds.has(slot.id)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate slot id: ${slot.id}`,
                path: [index, "id"],
            });
        }
        slotIds.add(slot.id);

        const positionKey = `${slot.column}:${slot.row}`;
        if (occupiedPositions.has(positionKey)) {
            context.addIssue({
                code: "custom",
                message: `Duplicate slot position: ${positionKey}`,
                path: [index],
            });
        }
        occupiedPositions.add(positionKey);

        if (slot.kind === SHIP_SLOT_KIND.DRIVE) {
            driveCount += 1;
        }
    });

    if (driveCount !== 1) {
        context.addIssue({
            code: "custom",
            message: "Ship chassis must have exactly one drive slot",
        });
    }
});

export const SHIP_CHASSIS_RECORD_SCHEMA = z
    .strictObject({
        name: z.string().min(1).meta({
            title: "Name",
        }),

        spriteId: z.string().regex(CONTENT_ID_PATTERN).meta({
            title: "Sprite",

            "x-editor-asset-bucket": "ship_chassis",
        }),

        maxHull: z.number().int().min(1).meta({
            title: "Maximum hull",
        }),

        slots: SHIP_SLOTS_SCHEMA.meta({
            title: "Slots",
        }),
    })
    .meta({
        title: "Ship Chassis",
    });

export const SHIP_CHASSIS_TUNING_SCHEMA = z
    .record(z.string().regex(CONTENT_ID_PATTERN), SHIP_CHASSIS_RECORD_SCHEMA)
    .meta({
        title: "Ship Chassis",
    });

export type ShipChassisTuningData = z.infer<typeof SHIP_CHASSIS_TUNING_SCHEMA>;
