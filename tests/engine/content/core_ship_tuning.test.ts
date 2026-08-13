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
    STICKY_MINES,
} from '../../../src/engine/content/catalogs/sticky_mines';
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
    STICKY_MINE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/sticky_mines';
import {
    SHIP_CHASSIS_ID,
    SHIP_SPRITE_ID,
} from '../../../src/engine/defs/ship_chassis';
import {
    SHIP_DRIVE_ID,
} from '../../../src/engine/defs/ship_drive';
import {
    STICKY_MINE_ID,
} from '../../../src/engine/defs/sticky_mine';

describe(
    'Core ship content tuning',
    () => {
        it(
            'preserves current chassis, drive, mine and behavior-rule values',
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
                    STICKY_MINES[
                        STICKY_MINE_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        STICKY_MINE_ID
                            .BASIC_00,

                    name:
                        'STICKY MINE',

                    fuseDurationMs:
                        7500,

                    damage: 1,
                });

                expect(
                    ENEMY_BEHAVIOR_RULES
                        .shield_placement
                        .impactReserveMs,
                ).toBe(1000);
            },
        );

        it(
            'rejects invalid tuning values',
            () => {
                expect(
                    SHIP_CHASSIS_TUNING_SCHEMA
                        .safeParse({
                            generic_00: {
                                name:
                                    'Our test ship',
                                spriteId:
                                    'not_a_sprite',
                                maxHull: 3,
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
                    STICKY_MINE_TUNING_SCHEMA
                        .safeParse({
                            basic_00: {
                                name:
                                    'STICKY MINE',
                                fuseDurationMs:
                                    -1,
                                damage: 1,
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
