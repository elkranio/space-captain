import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    ENEMY_BEHAVIOR_RULES,
} from '../../../src/engine/content/catalogs/enemy_behavior_rules';
import {
    SHIP_CHASSIS,
} from '../../../src/engine/content/catalogs/ship_chassis';
import {
    SHIP_DRIVES,
} from '../../../src/engine/content/catalogs/ship_drives';
import {
    ENEMY_BEHAVIOR_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/enemy_behavior_rules';
import {
    SHIP_CHASSIS_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_chassis';
import {
    SHIP_DRIVE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_drives';
import {
    SHIP_CHASSIS_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_DRIVE_ID,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_SLOT_KIND,
} from '../../../src/engine/defs/ship_slot';

describe(
    'Core ship content tuning',
    () => {
        it(
            'preserves current chassis, drive and behavior-rule values',
            () => {
                expect(
                    SHIP_CHASSIS[
                        SHIP_CHASSIS_ID
                            .GENERIC_00
                    ],
                ).toEqual({
                    id:
                        SHIP_CHASSIS_ID
                            .GENERIC_00,

                    name:
                        'Our test ship',

                    spriteId:
                        'new_perspective_00',

                    maxHull: 3,

                    slots: [
                        {
                            id: 'drive',
                            kind: SHIP_SLOT_KIND.DRIVE,
                            column: 1,
                            row: 2,
                        },
                        {
                            id: 'utility_01',
                            kind: SHIP_SLOT_KIND.UTILITY,
                            column: 2,
                            row: 2,
                        },
                        {
                            id: 'defense_01',
                            kind: SHIP_SLOT_KIND.DEFENSE,
                            column: 3,
                            row: 1,
                        },
                        {
                            id: 'defense_02',
                            kind: SHIP_SLOT_KIND.DEFENSE,
                            column: 3,
                            row: 2,
                        },
                        {
                            id: 'weapon_01',
                            kind: SHIP_SLOT_KIND.WEAPON,
                            column: 4,
                            row: 1,
                        },
                        {
                            id: 'weapon_02',
                            kind: SHIP_SLOT_KIND.WEAPON,
                            column: 4,
                            row: 2,
                        },
                        {
                            id: 'weapon_03',
                            kind: SHIP_SLOT_KIND.WEAPON,
                            column: 4,
                            row: 3,
                        },
                    ],
                });

                const basicDrive =
                    SHIP_DRIVES[
                        SHIP_DRIVE_ID
                            .BASIC_00
                    ];

                expect(
                    basicDrive,
                ).toMatchObject({
                    id:
                        SHIP_DRIVE_ID
                            .BASIC_00,

                    name:
                        'BASIC DRIVE',

                    maxIntegrity: 2,
                });

                expect(
                    basicDrive
                        .evadeWarmupMs,
                ).toBeGreaterThanOrEqual(0);

                expect(
                    basicDrive
                        .evadeDurationMs,
                ).toBeGreaterThan(0);

                expect(
                    basicDrive
                        .evadeCooldownMs,
                ).toBeGreaterThanOrEqual(0);

                expect(
                    basicDrive
                        .evadePowerCost,
                ).toBeGreaterThan(0);

                expect(
                    ENEMY_BEHAVIOR_RULES
                        .shield_placement
                        .impactReserveMs,
                ).toBe(1000);
            },
        );

        it(
            'accepts additional chassis and drive ids with valid tuning shape',
            () => {
                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
                            generic_00: {
                                name:
                                    'Our test ship',

                                spriteId:
                                    'generic_00',

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
                                name:
                                    'Heavy Ship',

                                spriteId:
                                    'heavy_00',

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
                        })
                        .success,
                ).toBe(true);

                expect(
                    SHIP_DRIVE_TUNING_SCHEMA
                        .safeParse({
                            basic_00: {
                                name:
                                    'BASIC DRIVE',

                                maxIntegrity:
                                    2,

                                evadeWarmupMs:
                                    1000,

                                evadeDurationMs:
                                    3000,

                                evadeCooldownMs:
                                    20000,

                                evadePowerCost:
                                    2,
                            },

                            fast_00: {
                                name:
                                    'FAST DRIVE',

                                maxIntegrity:
                                    2,

                                evadeWarmupMs:
                                    500,

                                evadeDurationMs:
                                    2500,

                                evadeCooldownMs:
                                    15000,

                                evadePowerCost:
                                    1,
                            },
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'rejects invalid chassis slot layouts',
            () => {
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
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
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
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
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
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
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
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
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
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
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
                        })
                        .success,
                ).toBe(false);
            },
        );

        it(
            'rejects invalid tuning values',
            () => {
                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
                            'Bad ID': {
                                name:
                                    'Our test ship',

                                spriteId:
                                    'generic_00',

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
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
                            generic_00: {
                                name:
                                    'Our test ship',

                                spriteId:
                                    'generic_00',

                                maxHull: 0,

                                slots: [
                                    {
                                        id: 'drive',
                                        kind: 'drive',
                                        column: 1,
                                        row: 1,
                                    },
                                ],
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_DRIVE_TUNING_SCHEMA
                        .safeParse({
                            'Bad ID': {
                                name:
                                    'BASIC DRIVE',

                                maxIntegrity:
                                    2,

                                evadeWarmupMs:
                                    1000,

                                evadeDurationMs:
                                    3000,

                                evadeCooldownMs:
                                    20000,

                                evadePowerCost:
                                    2,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_DRIVE_TUNING_SCHEMA
                        .safeParse({
                            basic_00: {
                                name: '',

                                maxIntegrity:
                                    2,

                                evadeWarmupMs:
                                    1000,

                                evadeDurationMs:
                                    3000,

                                evadeCooldownMs:
                                    20000,

                                evadePowerCost:
                                    2,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_DRIVE_TUNING_SCHEMA
                        .safeParse({
                            basic_00: {
                                name:
                                    'BASIC DRIVE',

                                maxIntegrity:
                                    2,

                                evadeWarmupMs:
                                    -1,

                                evadeDurationMs:
                                    3000,

                                evadeCooldownMs:
                                    20000,

                                evadePowerCost:
                                    2,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    ENEMY_BEHAVIOR_RULES_SCHEMA
                        .safeParse({
                            shield_placement: {
                                impactReserveMs:
                                    -1,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );
    },
);
