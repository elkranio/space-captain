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
    SHIP_SPRITE_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_DRIVE_ID,
} from '../../../src/engine/defs/ship_drive';

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
                        SHIP_SPRITE_ID
                            .GENERIC_00,

                    maxHull: 3,
                });

                expect(
                    SHIP_DRIVES[
                        SHIP_DRIVE_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        SHIP_DRIVE_ID
                            .BASIC_00,

                    name:
                        'BASIC DRIVE',
                });

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
                            },

                            heavy_00: {
                                name:
                                    'Heavy Ship',

                                spriteId:
                                    'heavy_00',

                                maxHull: 5,
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
                            },

                            fast_00: {
                                name:
                                    'FAST DRIVE',
                            },
                        })
                        .success,
                ).toBe(true);
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
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_DRIVE_TUNING_SCHEMA
                        .safeParse({
                            basic_00: {
                                name: '',
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
