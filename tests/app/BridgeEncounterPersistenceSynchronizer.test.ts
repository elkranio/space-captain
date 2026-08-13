// tests/app/BridgeEncounterPersistenceSynchronizer.test.ts

import {
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import BridgeEncounterPersistenceSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterPersistenceSynchronizer';
import {
    MISSILE_ID,
} from '../../src/engine/defs/missile';
import {
    PLAYER_LOCATION_KIND,
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../src/engine/defs/ship_drive';
import {
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';
import type {
    EncounterPresentationSnapshot,
} from '../../src/engine/encounter/snapshots/encounter_presentation_snapshot';

describe(
    'Bridge encounter persistence synchronizer',
    () => {
        it(
            'persists frame-backed ship systems and navigation',
            () => {
                const setPlayerShipPowerCoreState =
                    vi.fn();

                const setPlayerShipShieldGeneratorState =
                    vi.fn();

                const setPlayerShipWeaponStates =
                    vi.fn();

                const setPlayerSpaceNavigation =
                    vi.fn();

                const synchronizer =
                    new BridgeEncounterPersistenceSynchronizer(
                        {
                            setPlayerShipPowerCoreState,
                            setPlayerShipShieldGeneratorState,
                            setPlayerShipWeaponStates,
                            setPlayerSpaceNavigation,
                        } as unknown as GameRuntime,
                    );

                synchronizer.syncSnapshot({
                    navigation: {
                        kind:
                            PLAYER_SPACE_NAVIGATION_KIND
                                .ANCHORED,

                        anchorId:
                            'anchor_safe_00',
                    },

                    player: {
                        powerCore: {
                            state: {
                                id:
                                    'power_core_player_00',

                                powerCoreId:
                                    'power_core_basic_00',

                                charges: 3,
                                rechargeElapsedMs:
                                    1200,
                            },

                            capacity: 4,
                        },

                        shieldGenerator: {
                            id:
                                'shield_generator_player_00',

                            shieldGeneratorId:
                                'shield_generator_basic_00',

                            status:
                                'online',

                            phase:
                                'ready',

                            phaseElapsedMs: 0,
                        },

                        weapons: [],
                    },
                } as unknown as EncounterPresentationSnapshot);

                expect(
                    setPlayerShipPowerCoreState,
                ).toHaveBeenCalledWith({
                    id:
                        'power_core_player_00',

                    powerCoreId:
                        'power_core_basic_00',

                    charges: 3,
                    rechargeElapsedMs: 1200,
                });

                expect(
                    setPlayerShipShieldGeneratorState,
                ).toHaveBeenCalledWith({
                    id:
                        'shield_generator_player_00',

                    shieldGeneratorId:
                        'shield_generator_basic_00',

                    status:
                        'online',

                    phase:
                        'ready',

                    phaseElapsedMs: 0,
                });

                expect(
                    setPlayerShipWeaponStates,
                ).toHaveBeenCalledWith([]);

                expect(
                    setPlayerSpaceNavigation,
                ).toHaveBeenCalledWith({
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        'anchor_safe_00',
                });
            },
        );

        it(
            'persists event-driven player state',
            () => {
                const runtime =
                    new GameRuntime();

                const synchronizer =
                    new BridgeEncounterPersistenceSynchronizer(
                        runtime,
                    );

                synchronizer.syncEvent({
                        type:
                            ENCOUNTER_EVENT
                                .MISSILE_IMPACTED_PLAYER_SHIP,

                        projectile: {
                            id: 'projectile_1',
                            designation: 'M1',

                            kind:
                                COMBAT_PROJECTILE_KIND
                                    .MISSILE,

                            source: {
                                kind:
                                    COMBAT_SOURCE_KIND
                                        .ACTOR,

                                actorId:
                                    'ship_enemy_00',
                            },

                            sourceWeaponId:
                                'missile_launcher_00',

                            target: {
                                kind:
                                    COMBAT_TARGET_KIND
                                        .PLAYER_SHIP,
                            },

                            missileId:
                                MISSILE_ID.BASIC_00,

                            timeToImpactMs: 0,
                            initialTimeToImpactMs:
                                12000,
                        },

                        appliedDamage: 1,
                        remainingHull: 2,
                        destroyed: false,
                    });

                expect(
                    runtime.getCurrentRun()
                        .player.ship.hull,
                ).toBe(2);

                synchronizer.syncEvent({
                        type:
                            ENCOUNTER_EVENT
                                .PLAYER_SHIP_DRIVE_DISRUPTED,

                        sourceActorId:
                            'ship_enemy_00',

                        drive: {
                            id: 'drive_player_00',

                            driveId:
                                SHIP_DRIVE_ID
                                    .BASIC_00,

                            status:
                                SHIP_DRIVE_STATUS
                                    .DISABLED,
                        },

                        navigation: {
                            kind:
                                PLAYER_SPACE_NAVIGATION_KIND
                                    .ANCHORED,

                            anchorId:
                                'anchor_safe_00',
                        },
                    });

                const run =
                    runtime.getCurrentRun();

                expect(
                    run.player.ship.drive
                        .status,
                ).toBe(
                    SHIP_DRIVE_STATUS.DISABLED,
                );

                if (
                    run.player.location.kind !==
                    PLAYER_LOCATION_KIND.SPACE
                ) {
                    throw new Error(
                        'Expected player in space',
                    );
                }

                expect(
                    run.player.location.navigation,
                ).toEqual({
                    kind:
                        PLAYER_SPACE_NAVIGATION_KIND
                            .ANCHORED,

                    anchorId:
                        'anchor_safe_00',
                });
            },
        );

        it(
            'rejects an invalid incoming mine before mutating persistent hull',
            () => {
                const runtime =
                    new GameRuntime();

                const synchronizer =
                    new BridgeEncounterPersistenceSynchronizer(
                        runtime,
                    );

                expect(() => {
                    synchronizer.syncEvent({
                        type:
                            ENCOUNTER_EVENT
                                .STICKY_MINE_DETONATED,

                        mine: {
                            id: 'mine_invalid',

                            mineId:
                                STICKY_MINE_ID
                                    .BASIC_00,

                            source: {
                                kind:
                                    COMBAT_SOURCE_KIND
                                        .PLAYER_SHIP,
                            },

                            sourceWeaponId:
                                'player_dispenser',

                            target: {
                                kind:
                                    COMBAT_TARGET_KIND
                                        .ACTOR,

                                actorId:
                                    'ship_enemy_00',
                            },

                            timeToDetonationMs: 0,
                            initialTimeToDetonationMs:
                                7500,

                            damage: 1,
                        },

                        appliedDamage: 1,
                        remainingHull: 2,
                        destroyed: false,
                    });
                }).toThrow(
                    'Detonated incoming sticky mine has invalid source or target',
                );

                expect(
                    runtime.getCurrentRun()
                        .player.ship.hull,
                ).toBe(3);
            },
        );
    },
);
