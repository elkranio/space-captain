import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    SHIP_WEAPON_KIND,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    BEAM_CANNON_SHOT_OUTCOME,
    createBeamCannonAttackSnapshot,
} from '../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_EVENT,
} from '../../../src/engine/encounter/model/event';
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
    'player Evade Beam Cannon resolution',
    () => {
        it(
            'resolves an incoming Beam as MISS before shield or hull while EVADING',
            () => {
                const {
                    node,
                    stationId,
                } =
                    createSingleStationNodeFixture();

                const enemy =
                    ShipNodeActorFactory
                        .create({
                            id:
                                'ship_enemy_00',

                            presetId:
                                SHIP_NODE_ACTOR_PRESET_ID
                                    .ENEMY_GENERIC_BEAM_CANNON_00,

                            anchorId:
                                stationId,
                        });

                node.actors.push(
                    enemy,
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

                engine.step(0);
                engine.drainEvents();

                const state =
                    getMutableEncounterStateForTest(
                        engine,
                    );

                const beamCannon =
                    state.actors[0]
                        ?.weapons[0];

                if (
                    !beamCannon ||
                    beamCannon.kind !==
                        SHIP_WEAPON_KIND
                            .BEAM_CANNON
                ) {
                    throw new Error(
                        'Expected loaded enemy Beam Cannon',
                    );
                }

                const definition =
                    SHIP_WEAPONS[
                        beamCannon.weaponId
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON
                ) {
                    throw new Error(
                        'Expected Beam Cannon definition',
                    );
                }

                const activeAttack =
                    state.combat
                        .beamCannonAttacks[0];

                if (!activeAttack) {
                    throw new Error(
                        'Expected active incoming Beam attack',
                    );
                }

                const activeAttackSnapshot =
                    createBeamCannonAttackSnapshot(
                        activeAttack,
                    );

                beamCannon.phaseElapsedMs =
                    definition
                        .chargeDurationMs;

                state.evade.phase =
                    SHIP_EVADE_PHASE
                        .EVADING;

                state.evade.phaseElapsedMs =
                    0;

                state.evade.cooldownRemainingMs =
                    5000;

                const activeShield = {
                    sourceEmitterId:
                        'shield_generator_player_test',

                    remainingDurationMs:
                        4000,

                    initialDurationMs:
                        5000,
                };

                state.combat
                    .activeShield = {
                        ...activeShield,
                    };

                const hullBefore =
                    engine
                        .getPlayerHullState();

                engine.step(0);

                const events =
                    engine
                        .drainEvents();

                expect(
                    events,
                ).toContainEqual({
                    type:
                        ENCOUNTER_EVENT
                            .BEAM_CANNON_FIRED,

                    attack:
                        activeAttackSnapshot,

                    outcome:
                        BEAM_CANNON_SHOT_OUTCOME
                            .MISS,
                });

                expect(
                    events.some(
                        (event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .PLAYER_SHIELD_ENDED
                            );
                        },
                    ),
                ).toBe(false);

                expect(
                    engine
                        .getPlayerHullState(),
                ).toEqual(
                    hullBefore,
                );

                expect(
                    state.combat
                        .activeShield,
                ).toEqual(
                    activeShield,
                );

                expect(
                    state.combat
                        .beamCannonAttacks,
                ).toEqual([]);
            },
        );
    },
);
