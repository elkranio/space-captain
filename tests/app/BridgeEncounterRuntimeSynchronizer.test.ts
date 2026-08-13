import {
    MISSILE_SIGNATURE,
} from '../../src/engine/defs/missile';
// tests/app/BridgeEncounterRuntimeSynchronizer.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    GameRuntime,
} from '../../src/app/runtime/GameRuntime';
import BridgeEncounterRuntimeSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/engine_events/BridgeEncounterRuntimeSynchronizer';
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
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../src/engine/encounter/model/event';

describe(
    'Bridge encounter runtime synchronizer',
    () => {
        it(
            'persists event-driven player state',
            () => {
                const runtime =
                    new GameRuntime();

                const synchronizer =
                    new BridgeEncounterRuntimeSynchronizer(
                        runtime,
                    );

                synchronizer.synchronize({
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

                            signature:
                MISSILE_SIGNATURE.A,

            identification: {
                                status:
                                    MISSILE_SIGNATURE_INTEL_STATUS
                                        .UNKNOWN,
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

                synchronizer.synchronize({
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
                    new BridgeEncounterRuntimeSynchronizer(
                        runtime,
                    );

                expect(() => {
                    synchronizer.synchronize({
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
