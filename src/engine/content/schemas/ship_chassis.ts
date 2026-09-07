// src/engine/content/schemas/ship_chassis.ts

import * as z from "zod";
import {
    SHIP_CHASSIS_SURFACE_HEIGHT,
    SHIP_CHASSIS_SURFACE_WIDTH,
} from "../../defs/ship_chassis";
import {
    SHIP_SLOT_HEIGHT,
    SHIP_SLOT_KIND,
    SHIP_SLOT_WIDTH,
} from "../../defs/ship_slot";

const CONTENT_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

const SHIP_SLOT_KIND_SCHEMA = z.union([
    z.literal(SHIP_SLOT_KIND.HULL),
    z.literal(SHIP_SLOT_KIND.BRIDGE),
    z.literal(SHIP_SLOT_KIND.DRIVE),
    z.literal(SHIP_SLOT_KIND.WEAPON),
    z.literal(SHIP_SLOT_KIND.DEFENSE),
    z.literal(SHIP_SLOT_KIND.UTILITY),
]);

const SHIP_SLOT_SCHEMA = z.strictObject({
    id: z.string().regex(CONTENT_ID_PATTERN),
    kind: SHIP_SLOT_KIND_SCHEMA,

    // Геометрия slot хранится центром внутри канонической chassis surface.
    x: z
        .number()
        .int()
        .min(SHIP_SLOT_WIDTH / 2)
        .max(SHIP_CHASSIS_SURFACE_WIDTH - SHIP_SLOT_WIDTH / 2),
    y: z
        .number()
        .int()
        .min(SHIP_SLOT_HEIGHT / 2)
        .max(SHIP_CHASSIS_SURFACE_HEIGHT - SHIP_SLOT_HEIGHT / 2),
});

const SHIP_SLOTS_SCHEMA = z.array(SHIP_SLOT_SCHEMA).min(3).superRefine((slots, context) => {
    const slotIds = new Set<string>();
    let hullCount = 0;
    let bridgeCount = 0;
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

        for (let otherIndex = 0; otherIndex < index; otherIndex += 1) {
            const other = slots[otherIndex];
            const overlapsX = Math.abs(slot.x - other.x) < SHIP_SLOT_WIDTH;
            const overlapsY = Math.abs(slot.y - other.y) < SHIP_SLOT_HEIGHT;

            if (overlapsX && overlapsY) {
                context.addIssue({
                    code: "custom",
                    message: `Overlapping ship slots: ${other.id}/${slot.id}`,
                    path: [index],
                });
            }
        }

        switch (slot.kind) {
            case SHIP_SLOT_KIND.HULL:
                hullCount += 1;
                break;

            case SHIP_SLOT_KIND.BRIDGE:
                bridgeCount += 1;
                break;

            case SHIP_SLOT_KIND.DRIVE:
                driveCount += 1;
                break;
        }
    });

    if (hullCount !== 1) {
        context.addIssue({
            code: "custom",
            message: "Ship chassis must have exactly one hull slot",
        });
    }

    if (bridgeCount !== 1) {
        context.addIssue({
            code: "custom",
            message: "Ship chassis must have exactly one bridge slot",
        });
    }

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

        blueprintId: z.string().regex(CONTENT_ID_PATTERN).meta({
            title: "Blueprint",
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
