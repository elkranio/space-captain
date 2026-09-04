import chassisData from '../../../src/engine/content/data/ship_chassis.json';
import driveData from '../../../src/engine/content/data/ship_drives.json';
import behaviorRulesData from '../../../src/engine/content/data/enemy_behavior_rules.json';
import { describe, expect, it } from 'vitest';
import { ENEMY_BEHAVIOR_RULES } from '../../../src/engine/content/catalogs/enemy_behavior_rules';
import { SHIP_CHASSIS } from '../../../src/engine/content/catalogs/ship_chassis';
import { SHIP_DRIVES } from '../../../src/engine/content/catalogs/ship_drives';
import { ENEMY_BEHAVIOR_RULES_SCHEMA } from '../../../src/engine/content/schemas/enemy_behavior_rules';
import { SHIP_CHASSIS_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_chassis';
import { SHIP_DRIVE_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_drives';
import { SHIP_SLOT_KIND } from '../../../src/engine/defs/ship_slot';

describe('Core ship content tuning', () => {
    it('loads chassis, drive and behavior rules from current JSON', () => {
        for (const [id, tuning] of Object.entries(chassisData)) {
            expect(SHIP_CHASSIS[id]).toEqual({ id, ...tuning });
        }
        for (const [id, tuning] of Object.entries(driveData)) {
            expect(SHIP_DRIVES[id]).toEqual({ id, slotKind: SHIP_SLOT_KIND.DRIVE, ...tuning });
        }
        expect(ENEMY_BEHAVIOR_RULES).toEqual(behaviorRulesData);
    });

    it('accepts additional chassis and drive ids with valid tuning shape', () => {
        expect(
            SHIP_CHASSIS_TUNING_SCHEMA.safeParse({
                generic_00: {
                    name: 'Our test ship',

                    spriteId: 'generic_00',

                    maxHull: 3,

                    slots: [
                        {
                            id: 'drive',
                            kind: 'drive',
                            column: 1,
                            row: 1,
                        },
                    ],
                },

                heavy_00: {
                    name: 'Heavy Ship',

                    spriteId: 'heavy_00',

                    maxHull: 5,

                    slots: [
                        {
                            id: 'drive',
                            kind: 'drive',
                            column: 2,
                            row: 1,
                        },
                        {
                            id: 'weapon_01',
                            kind: 'weapon',
                            column: 4,
                            row: 1,
                        },
                    ],
                },
            }).success,
        ).toBe(true);

        expect(
            SHIP_DRIVE_TUNING_SCHEMA.safeParse({
                basic_00: {
                    name: 'BASIC DRIVE',
                    shortName: 'DRIVE',

                    maxIntegrity: 2,

                    evadeWarmupMs: 1000,

                    evadeDurationMs: 3000,

                    evadeCooldownMs: 20000,

                    evadePowerCost: 2,
                },

                fast_00: {
                    name: 'FAST DRIVE',
                    shortName: 'FAST DRIVE',

                    maxIntegrity: 2,

                    evadeWarmupMs: 500,

                    evadeDurationMs: 2500,

                    evadeCooldownMs: 15000,

                    evadePowerCost: 1,
                },
            }).success,
        ).toBe(true);
    });

    it('rejects invalid chassis slot layouts', () => {
        const validChassis = {
            name: 'Test ship',
            spriteId: 'generic_00',
            maxHull: 3,
            slots: [
                {
                    id: 'drive',
                    kind: 'drive',
                    column: 1,
                    row: 1,
                },
                {
                    id: 'weapon_01',
                    kind: 'weapon',
                    column: 4,
                    row: 1,
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
                            kind: 'weapon',
                            column: 3,
                            row: 1,
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
                            column: 4,
                            row: 1,
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
                        {
                            id: 'weapon_01',
                            kind: 'weapon',
                            column: 4,
                            row: 1,
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
                            id: 'drive_02',
                            kind: 'drive',
                            column: 2,
                            row: 1,
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
                        {
                            id: 'drive',
                            kind: 'drive',
                            column: 5,
                            row: 1,
                        },
                    ],
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
