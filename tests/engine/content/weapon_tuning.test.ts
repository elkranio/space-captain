import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    BEAM_CANNON_TUNING_SCHEMA,
    MISSILE_LAUNCHER_TUNING_SCHEMA,
    SPAM_PROJECTOR_TUNING_SCHEMA,
    STICKY_MINE_DISPENSER_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIP_SLOT_KIND,
} from '../../../src/engine/defs/ship_slot';

describe(
    'Weapon content tuning',
    () => {
        it(
            'loads every built-in weapon family into the unified catalog',
            () => {
                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00
                    ],
                ).toMatchObject({
                    id:
                        SHIP_WEAPON_ID
                            .MISSILE_LAUNCHER_00,
                    kind:
                        SHIP_WEAPON_KIND
                            .MISSILE_LAUNCHER,
                    slotKind:
                        SHIP_SLOT_KIND.WEAPON,
                    maxIntegrity: 2,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00
                    ],
                ).toMatchObject({
                    id:
                        SHIP_WEAPON_ID
                            .BEAM_CANNON_00,
                    hullDamage: 1,
                    moduleDamage: 1,
                    powerCost: 1,
                    kind:
                        SHIP_WEAPON_KIND
                            .BEAM_CANNON,
                    slotKind:
                        SHIP_SLOT_KIND.WEAPON,
                    maxIntegrity: 2,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00
                    ],
                ).toMatchObject({
                    id:
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00,
                    kind:
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,
                    slotKind:
                        SHIP_SLOT_KIND.UTILITY,
                    maxIntegrity: 2,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00
                    ],
                ).toMatchObject({
                    id:
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00,
                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,
                    slotKind:
                        SHIP_SLOT_KIND.WEAPON,
                    maxIntegrity: 2,
                });
            },
        );

        it(
            'accepts new weapon ids inside their concrete family schema',
            () => {
                expect(
                    MISSILE_LAUNCHER_TUNING_SCHEMA
                        .safeParse({
                            heavy_launcher_00: {
                                name:
                                    'HEAVY LAUNCHER',
                                shortName:
                                    'HEAVY LAUNCHER',

                                maxIntegrity: 3,

                                damage: 2,
                                targetingDurationMs:
                                    3500,
                                flightDurationMs:
                                    14000,
                                ammoCapacity: 3,
                                cooldownDurationMs:
                                    18000,
                            },
                        })
                        .success,
                ).toBe(true);

                expect(
                    BEAM_CANNON_TUNING_SCHEMA
                        .safeParse({
                            fast_beam_cannon_00: {
                                name:
                                    'FAST BEAM_CANNON',
                                shortName:
                                    'FAST BEAM',

                                maxIntegrity: 2,

                                hullDamage: 1,
                                moduleDamage: 1,
                                powerCost: 1,
                                chargeDurationMs:
                                    8000,
                                cooldownDurationMs:
                                    12000,
                            },
                        })
                        .success,
                ).toBe(true);

                expect(
                    SPAM_PROJECTOR_TUNING_SCHEMA
                        .safeParse({
                            spam_projector_01: {
                                name:
                                    'SPAM PROJECTOR II',
                                shortName:
                                    'SPAM PROJECTOR',

                                maxIntegrity: 2,

                                channelDurationMs:
                                    24000,

                                officerTaskProgressMultiplier:
                                    0.4,

                                cooldownDurationMs:
                                    18000,
                            },
                        })
                        .success,
                ).toBe(true);

                expect(
                    STICKY_MINE_DISPENSER_TUNING_SCHEMA
                        .safeParse({
                            mine_dispenser_01: {
                                name:
                                    'MINE DISPENSER II',
                                shortName:
                                    'MINE DISPENSER',

                                maxIntegrity: 4,

                                damage: 2,
                                fuseDurationMs:
                                    9000,
                                ammoCapacity: 4,
                                salvoSize: 2,
                                launchIntervalMs:
                                    1500,
                                cooldownDurationMs:
                                    17000,
                            },
                        })
                        .success,
                ).toBe(true);
            },
        );

        it(
            'rejects invalid family tuning',
            () => {
                expect(
                    MISSILE_LAUNCHER_TUNING_SCHEMA
                        .safeParse({
                            bad_launcher_00: {
                                name:
                                    'BAD LAUNCHER',

                                maxIntegrity: 2,

                                damage: -1,
                                targetingDurationMs:
                                    3000,
                                flightDurationMs:
                                    12000,
                                ammoCapacity: 5,
                                cooldownDurationMs:
                                    15000,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    STICKY_MINE_DISPENSER_TUNING_SCHEMA
                        .safeParse({
                            bad_dispenser_00: {
                                name:
                                    'BAD DISPENSER',

                                maxIntegrity: 2,

                                damage: 1,
                                fuseDurationMs:
                                    7500,
                                ammoCapacity: 6,
                                salvoSize: 0,
                                launchIntervalMs:
                                    1000,
                                cooldownDurationMs:
                                    15000,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );
    },
);
