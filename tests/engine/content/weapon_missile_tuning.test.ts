import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILES,
} from '../../../src/engine/content/catalogs/missiles';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    MISSILE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/missiles';
import {
    SHIP_WEAPON_RULES_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapon_rules';
import {
    SHIP_WEAPON_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_weapons';
import {
    MISSILE_ID,
    MISSILE_SPECTRAL_BAND,
} from '../../../src/engine/defs/missile';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';

describe(
    'Weapon and missile content tuning',
    () => {
        it(
            'preserves current runtime weapon definitions',
            () => {
                expect(
                    SHIP_WEAPON_TARGETING_DURATION_MS,
                ).toBe(3000);

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

                    name:
                        'MISSILE LAUNCHER',

                    ammoCapacity: 5,

                    cooldownDurationMs:
                        15000,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .LASER_00
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_WEAPON_KIND
                            .LASER,

                    damage: 1,

                    chargeDurationMs:
                        12000,

                    cooldownDurationMs:
                        15000,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .SPAM_PROJECTOR_00
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_WEAPON_KIND
                            .SPAM_PROJECTOR,

                    channelDurationMs:
                        20000,

                    officerTaskProgressMultiplier:
                        0.5,
                });

                expect(
                    SHIP_WEAPONS[
                        SHIP_WEAPON_ID
                            .STICKY_MINE_DISPENSER_00
                    ],
                ).toMatchObject({
                    kind:
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER,

                    ammoCapacity: 6,
                    salvoSize: 3,
                    launchIntervalMs: 1000,
                });
            },
        );

        it(
            'preserves current runtime missile definitions',
            () => {
                expect(
                    MISSILES[
                        MISSILE_ID.RED_00
                    ],
                ).toEqual({
                    id:
                        MISSILE_ID.RED_00,

                    name:
                        'RED-BAND MISSILE',

                    spectralBand:
                        MISSILE_SPECTRAL_BAND
                            .RED,

                    damage: 1,

                    flightDurationMs:
                        12000,
                });

                expect(
                    MISSILES[
                        MISSILE_ID.BLUE_00
                    ].spectralBand,
                ).toBe(
                    MISSILE_SPECTRAL_BAND
                        .BLUE,
                );
            },
        );

        it(
            'rejects structurally invalid weapon tuning',
            () => {
                expect(
                    SHIP_WEAPON_RULES_SCHEMA
                        .safeParse({
                            enemy_targeting: {
                                durationMs: -1,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIP_WEAPON_TUNING_SCHEMA
                        .safeParse({
                            missile_launcher_00: {
                                name:
                                    'MISSILE LAUNCHER',
                                ammoCapacity: 5,
                                cooldownDurationMs:
                                    15000,
                            },
                            laser_00: {
                                name:
                                    'LASER EMITTER',
                                damage: 1,
                                chargeDurationMs:
                                    12000,
                                cooldownDurationMs:
                                    15000,
                            },
                            spam_projector_00: {
                                name:
                                    'SPAM PROJECTOR',
                                channelDurationMs:
                                    20000,
                                officerTaskProgressMultiplier:
                                    0,
                                cooldownDurationMs:
                                    15000,
                            },
                            sticky_mine_dispenser_00: {
                                name:
                                    'STICKY MINE DISPENSER',
                                ammoCapacity: 6,
                                salvoSize: 3,
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

        it(
            'rejects unknown missile bands',
            () => {
                expect(
                    MISSILE_TUNING_SCHEMA
                        .safeParse({
                            red_00: {
                                name:
                                    'RED-BAND MISSILE',
                                spectralBand:
                                    'green',
                                damage: 1,
                                flightDurationMs:
                                    12000,
                            },
                            blue_00: {
                                name:
                                    'BLUE-BAND MISSILE',
                                spectralBand:
                                    'blue',
                                damage: 1,
                                flightDurationMs:
                                    12000,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );
    },
);
