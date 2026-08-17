import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_DRIVES,
} from '../../../src/engine/content/catalogs/ship_drives';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';
import {
    createPlayerHullFixture,
} from '../../fixtures/engine/player_hull_fixtures';
import {
    createShipDriveFixture,
} from '../../fixtures/engine/ship_drive_fixtures';
import {
    createSingleStationNodeFixture,
} from '../../fixtures/engine/space_node_fixtures';
import {
    getMutableEncounterStateForTest,
} from './get_mutable_encounter_state_for_test';

describe(
    'temporary enemy opening Evade playtest hook',
    () => {
        it(
            'starts the real shared Evade lifecycle when hostile engagement begins',
            () => {
                const {
                    node,
                    stationId,
                } =
                    createSingleStationNodeFixture();

                node.actors.push(
                    ShipNodeActorFactory
                        .create({
                            id:
                                'ship_enemy_00',

                            presetId:
                                SHIP_NODE_ACTOR_PRESET_ID
                                    .ENEMY_GENERIC_00,

                            anchorId:
                                stationId,
                        }),
                );

                const engine =
                    new EncounterEngine({
                        playerHull:
                            createPlayerHullFixture(),

                        drive:
                            createShipDriveFixture(),

                        node,

                        navigation: {
                            kind:
                                PLAYER_SPACE_NAVIGATION_KIND
                                    .ANCHORED,

                            anchorId:
                                stationId,
                        },

                        random:
                            () => 0.5,
                    });

                engine.drainEvents();

                const state =
                    getMutableEncounterStateForTest(
                        engine,
                    );

                const enemy =
                    state.actors[0];

                if (!enemy) {
                    throw new Error(
                        'Expected enemy actor',
                    );
                }

                const definition =
                    SHIP_DRIVES[
                        enemy.drive
                            .driveId
                    ];

                expect(
                    enemy.evade,
                ).toEqual({
                    phase:
                        SHIP_EVADE_PHASE
                            .READY,

                    phaseElapsedMs:
                        0,

                    cooldownRemainingMs:
                        0,
                });

                engine
                    .engageHostileActors();

                expect(
                    enemy.evade.phase,
                ).toBe(
                    definition
                        .evadeWarmupMs >
                        0
                        ? SHIP_EVADE_PHASE
                              .WARMUP
                        : SHIP_EVADE_PHASE
                              .EVADING,
                );

                expect(
                    enemy.evade
                        .cooldownRemainingMs,
                ).toBe(
                    definition
                        .evadeCooldownMs,
                );

                const [
                    enemyPresentation,
                ] =
                    engine
                        .getPresentationSnapshot()
                        .enemyShips;

                expect(
                    enemyPresentation
                        ?.evade,
                ).toEqual(
                    enemy.evade,
                );

                expect(
                    enemyPresentation
                        ?.evade,
                ).not.toBe(
                    enemy.evade,
                );

                expect(
                    enemyPresentation
                        ?.evadeDurationMs,
                ).toBe(
                    definition
                        .evadeDurationMs,
                );

                if (
                    definition
                        .evadeWarmupMs >
                    0
                ) {
                    engine.step(
                        definition
                            .evadeWarmupMs,
                    );
                }

                expect(
                    enemy.evade.phase,
                ).toBe(
                    SHIP_EVADE_PHASE
                        .EVADING,
                );
            },
        );

        it(
            'does not start opening Evade with a disabled enemy drive',
            () => {
                const {
                    node,
                    stationId,
                } =
                    createSingleStationNodeFixture();

                node.actors.push(
                    ShipNodeActorFactory
                        .create({
                            id:
                                'ship_enemy_00',

                            presetId:
                                SHIP_NODE_ACTOR_PRESET_ID
                                    .ENEMY_GENERIC_00,

                            anchorId:
                                stationId,
                        }),
                );

                const engine =
                    new EncounterEngine({
                        playerHull:
                            createPlayerHullFixture(),

                        drive:
                            createShipDriveFixture(),

                        node,

                        navigation: {
                            kind:
                                PLAYER_SPACE_NAVIGATION_KIND
                                    .ANCHORED,

                            anchorId:
                                stationId,
                        },
                    });

                engine.drainEvents();

                const state =
                    getMutableEncounterStateForTest(
                        engine,
                    );

                const enemy =
                    state.actors[0];

                if (!enemy) {
                    throw new Error(
                        'Expected enemy actor',
                    );
                }

                enemy.drive.status =
                    SHIP_DRIVE_STATUS
                        .DISABLED;

                engine
                    .engageHostileActors();

                expect(
                    enemy.evade,
                ).toEqual({
                    phase:
                        SHIP_EVADE_PHASE
                            .READY,

                    phaseElapsedMs:
                        0,

                    cooldownRemainingMs:
                        0,
                });
            },
        );
    },
);
