import chassisData from '../../../src/engine/content/data/ship_chassis.json';
import driveData from '../../../src/engine/content/data/ship_drives.json';
import powerCoreData from '../../../src/engine/content/data/power_cores.json';
import behaviorRulesData from '../../../src/engine/content/data/enemy_behavior_rules.json';
import { describe, expect, it } from 'vitest';
import { ENEMY_BEHAVIOR_RULES } from '../../../src/engine/content/catalogs/enemy_behavior_rules';
import { SHIP_CHASSIS } from '../../../src/engine/content/catalogs/ship_chassis';
import { SHIP_DRIVES } from '../../../src/engine/content/catalogs/ship_drives';
import { POWER_CORES } from '../../../src/engine/content/catalogs/power_cores';
import { ENEMY_BEHAVIOR_RULES_SCHEMA } from '../../../src/engine/content/schemas/enemy_behavior_rules';
import { SHIP_CHASSIS_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_chassis';
import { SHIP_DRIVE_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_drives';
import { POWER_CORE_TUNING_SCHEMA } from '../../../src/engine/content/schemas/power_cores';
import {
    SHIP_CHASSIS_SURFACE_HEIGHT,
    SHIP_CHASSIS_SURFACE_WIDTH,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_SLOT_HEIGHT,
    SHIP_SLOT_KIND,
    SHIP_SLOT_WIDTH,
} from '../../../src/engine/defs/ship_slot';

describe('Core ship content tuning', () => {
    it('loads chassis, drive, Power Core and behavior rules from current JSON', () => {
        for (const [id, tuning] of Object.entries(chassisData)) {
            expect(SHIP_CHASSIS[id]).toEqual({ id, ...tuning });
        }
        for (const [id, tuning] of Object.entries(driveData)) {
            expect(SHIP_DRIVES[id]).toEqual({ id, slotKind: SHIP_SLOT_KIND.DRIVE, ...tuning });
        }
        for (const [id, tuning] of Object.entries(powerCoreData)) {
            expect(POWER_CORES[id]).toEqual({ id, slotKind: SHIP_SLOT_KIND.POWER_CORE, ...tuning });
        }
        expect(ENEMY_BEHAVIOR_RULES).toEqual(behaviorRulesData);
    });

    it('accepts additional chassis and drive ids with valid tuning shape', () => {
        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                generic_00: chassisData.generic_00,
                heavy_00: {
                    ...chassisData.generic_00,
                    name: 'Heavy Ship',
                    spriteId: 'heavy_00',
                    blueprintId: 'heavy_00',
                    maxHull: 5,
                },
            }).success,
        ).toBe(true);

        expect(
            SHIP_DRIVE_TUNING_SCHEMA.safeParse({
                basic_00: driveData.basic_00,
                fast_00: {
                    ...driveData.basic_00,
                    name: 'FAST DRIVE',
                    shortName: 'FAST DRIVE',
                    evadeWarmupMs: 500,
                    evadeDurationMs: 2500,
                    evadeCooldownMs: 15000,
                    evadePowerCost: 1,
                },
            }).success,
        ).toBe(true);

        expect(
            POWER_CORE_TUNING_SCHEMA.safeParse({
                ...powerCoreData,
                overcharged_00: {
                    ...powerCoreData.power_core_basic_00,
                    name: 'OVERCHARGED CORE',
                    shortName: 'OVERCHARGED',
                    capacity: 8,
                },
            }).success,
        ).toBe(true);
    });

    it('rejects invalid chassis slot layouts', () => {
        const validChassis = {
            name: 'Test ship',
            spriteId: 'generic_00',
            blueprintId: 'generic_00',
            maxHull: 3,
            slots: [
                {
                    id: 'hull',
                    kind: 'hull',
                    x: -75,
                    y: 0,
                },
                {
                    id: 'bridge',
                    kind: 'bridge',
                    x: 250,
                    y: 0,
                },
                {
                    id: 'drive',
                    kind: 'drive',
                    x: -225,
                    y: 0,
                },
                {
                    id: 'power_core',
                    kind: 'power_core',
                    x: -75,
                    y: 80,
                },
                {
                    id: 'weapon_01',
                    kind: 'weapon',
                    x: 150,
                    y: -80,
                },
            ],
        };

        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                test_00: {
                    ...validChassis,
                    slots: [
                        ...validChassis.slots,
                        {
                            id: 'weapon_01',
                            kind: 'utility',
                            x: -75,
                            y: 80,
                        },
                    ],
                },
            }).success,
        ).toBe(false);

        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                test_00: {
                    ...validChassis,
                    slots: [
                        ...validChassis.slots,
                        {
                            id: 'utility_01',
                            kind: 'utility',
                            x: 130,
                            y: -60,
                        },
                    ],
                },
            }).success,
        ).toBe(false);

        for (const fixedSlotId of ['hull', 'bridge', 'drive', 'power_core']) {
            expect(
                SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                    test_00: {
                        ...validChassis,
                        slots: validChassis.slots.filter((slot) => slot.id !== fixedSlotId),
                    },
                }).success,
            ).toBe(false);
        }

        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                test_00: {
                    ...validChassis,
                    slots: [
                        ...validChassis.slots,
                        {
                            id: 'drive_02',
                            kind: 'drive',
                            x: -225,
                            y: 80,
                        },
                    ],
                },
            }).success,
        ).toBe(false);

        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                test_00: {
                    ...validChassis,
                    slots: validChassis.slots.map((slot) =>
                        slot.id === 'drive'
                            ? {
                                  ...slot,
                                  x: -SHIP_CHASSIS_SURFACE_WIDTH / 2 + SHIP_SLOT_WIDTH / 2 - 1,
                              }
                            : slot,
                    ),
                },
            }).success,
        ).toBe(false);

        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                test_00: {
                    ...validChassis,
                    slots: validChassis.slots.map((slot) =>
                        slot.id === 'drive'
                            ? {
                                  ...slot,
                                  y: -SHIP_CHASSIS_SURFACE_HEIGHT / 2 + SHIP_SLOT_HEIGHT / 2 - 1,
                              }
                            : slot,
                    ),
                },
            }).success,
        ).toBe(false);
    });

    it('rejects invalid tuning values', () => {
        const badChassisId = SHIP_CHASSIS_TUNING_SCHEMA.safeParse({ 'Bad ID': chassisData.generic_00 });
        expect(badChassisId.error?.issues.map((issue) => issue.path)).toEqual([['Bad ID']]);
        const badHull = SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
            generic_00: { ...chassisData.generic_00, maxHull: 0 },
        });
        expect(badHull.error?.issues.map((issue) => issue.path)).toEqual([['generic_00', 'maxHull']]);
        const badBlueprintId = SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
            generic_00: { ...chassisData.generic_00, blueprintId: 'Bad ID' },
        });
        expect(badBlueprintId.error?.issues.map((issue) => issue.path)).toEqual([
            ['generic_00', 'blueprintId'],
        ]);
        const badDriveId = SHIP_DRIVE_TUNING_SCHEMA.safeParse({ 'Bad ID': driveData.basic_00 });
        expect(badDriveId.error?.issues.map((issue) => issue.path)).toEqual([['Bad ID']]);
        for (const [field, value] of [
            ['name', ''],
            ['evadeWarmupMs', -1],
        ] as const) {
            const result = SHIP_DRIVE_TUNING_SCHEMA.safeParse({
                basic_00: { ...driveData.basic_00, [field]: value },
            });
            expect(result.error?.issues.map((issue) => issue.path)).toEqual([['basic_00', field]]);
        }
        const badReserve = ENEMY_BEHAVIOR_RULES_SCHEMA.safeParse({ shield_placement: { impactReserveMs: -1 } });
        expect(badReserve.error?.issues.map((issue) => issue.path)).toEqual([['shield_placement', 'impactReserveMs']]);
    });
});
