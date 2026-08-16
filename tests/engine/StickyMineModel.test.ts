// tests/engine/StickyMineModel.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../src/engine/defs/ship_weapon';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../src/engine/encounter/model/combat';

describe(
    'Sticky mine model',
    () => {
        it(
            'owns physical mine tuning on the dispenser definition',
            () => {
                const definition =
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00
                    ];

                expect(
                    definition,
                ).toMatchObject({
                    name:
                        'STICKY MINE DISPENSER',

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    damage: 1,
                    fuseDurationMs: 7500,

                    ammoCapacity: 6,

                    salvoSize: 3,
                    launchIntervalMs:
                        1000,

                    cooldownDurationMs:
                        17000,
                });
            },
        );

        it(
            'keeps installed ammunition and attached runtime mine state explicit',
            () => {
                const dispenser:
                    StickyMineDispenserState = {
                        id:
                            'enemy_sticky_mine_dispenser',

                        weaponId:
                            SHIP_WEAPON_ID
                                .STICKY_MINE_DISPENSER_00,

                        kind:
                            SHIP_WEAPON_KIND
                                .STICKY_MINE_DISPENSER,

                        ammoCount: 6,

                        phase:
                            SHIP_WEAPON_PHASE
                                .READY,

                        phaseElapsedMs: 0,
                        cooldownRemainingMs: 0,

                        dispensedMineCount:
                            0,
                    };

                const mine:
                    StickyMineState = {
                        id:
                            'sticky_mine_1',

                        source: {
                            kind:
                                COMBAT_SOURCE_KIND
                                    .ACTOR,

                            actorId:
                                'enemy_ship',
                        },

                        sourceWeaponId:
                            dispenser.id,

                        target: {
                            kind:
                                COMBAT_TARGET_KIND
                                    .PLAYER_SHIP,
                        },

                        timeToDetonationMs:
                            7500,

                        initialTimeToDetonationMs:
                            7500,

                        damage: 1,
                    };

                expect(
                    dispenser.ammoCount,
                ).toBe(6);

                expect(
                    dispenser
                        .dispensedMineCount,
                ).toBe(0);

                expect(
                    mine
                        .timeToDetonationMs,
                ).toBe(7500);

                expect(
                    mine.damage,
                ).toBe(1);
            },
        );
    },
);
