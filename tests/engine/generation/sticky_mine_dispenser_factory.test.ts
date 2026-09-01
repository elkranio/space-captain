// tests/engine/generation/sticky_mine_dispenser_factory.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_SLOT_KIND,
} from '../../../src/engine/defs/ship_slot';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import StickyMineDispenserFactory from '../../../src/engine/generation/ship_weapon/StickyMineDispenserFactory';

describe(
    'StickyMineDispenserFactory',
    () => {
        it(
            'creates fresh dispenser state directly from weapon content',
            () => {
                const definition =
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00
                    ];

                expect(definition).toEqual({
                    id:
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00,

                    name:
                        'STICKY MINE DISPENSER',

                    shortName:
                        'MINE DISPENSER',

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    slotKind:
                        SHIP_SLOT_KIND
                            .WEAPON,

                    maxIntegrity: 2,

                    damage: 1,
                    fuseDurationMs: 7500,

                    ammoCapacity: 6,
                    salvoSize: 3,
                    launchIntervalMs: 1000,
                    cooldownDurationMs: 17000,
                });

                const first =
                    StickyMineDispenserFactory
                        .create({
                            id:
                                'dispenser_00',

                            weaponId:
                                SHIP_WEAPON_ID
                                    .STICKY_MINE_DISPENSER_00,
                        });

                const second =
                    StickyMineDispenserFactory
                        .create({
                            id:
                                'dispenser_01',

                            weaponId:
                                SHIP_WEAPON_ID
                                    .STICKY_MINE_DISPENSER_00,
                        });

                expect(first).toEqual({
                    id:
                        'dispenser_00',

                    weaponId:
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00,

                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    ammoCount: 6,

                    phase:
                        SHIP_WEAPON_PHASE.READY,

                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,

                    dispensedMineCount: 0,
                });

                expect(first)
                    .not.toBe(second);

                first.ammoCount = 0;
                first.phase =
                    SHIP_WEAPON_PHASE.COOLDOWN;

                expect(
                    second.ammoCount,
                ).toBe(6);

                expect(
                    second.phase,
                ).toBe(
                    SHIP_WEAPON_PHASE.READY,
                );
            },
        );

        it(
            'supports a bounded initial ammo override',
            () => {
                const dispenser =
                    StickyMineDispenserFactory
                        .create({
                            id:
                                'dispenser_00',

                            weaponId:
                                SHIP_WEAPON_ID
                                    .STICKY_MINE_DISPENSER_00,

                            ammoCount: 2,
                        });

                expect(
                    dispenser.ammoCount,
                ).toBe(2);

                expect(() => {
                    StickyMineDispenserFactory
                        .create({
                            id:
                                'dispenser_invalid',

                            weaponId:
                                SHIP_WEAPON_ID
                                    .STICKY_MINE_DISPENSER_00,

                            ammoCount: 7,
                        });
                }).toThrow(
                    'Invalid sticky-mine dispenser ammo count: 7/6',
                );
            },
        );
    },
);
