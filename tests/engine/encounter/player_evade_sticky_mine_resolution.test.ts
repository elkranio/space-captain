import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import {
    SHIP_NODE_ACTOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_node_actors';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_EVADE_PHASE,
} from '../../../src/engine/defs/ship_evade';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
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
    'player Evade sticky mine resolution',
    () => {
        it(
            'commits an enemy mine but does not attach it while the player is EVADING',
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
                                    .ENEMY_GENERIC_STICKY_MINES_00,

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
                        'Expected sticky-mine enemy',
                    );
                }

                const dispenser =
                    enemy.weapons[0];

                if (
                    !dispenser ||
                    dispenser.kind !==
                        SHIP_WEAPON_KIND
                            .STICKY_MINE_DISPENSER
                ) {
                    throw new Error(
                        'Expected enemy sticky-mine dispenser',
                    );
                }

                const definition =
                    SHIP_WEAPONS[
                        dispenser.weaponId
                    ];

                if (
                    definition.kind !==
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER
                ) {
                    throw new Error(
                        'Expected sticky-mine dispenser definition',
                    );
                }

                state.evade.phase =
                    SHIP_EVADE_PHASE
                        .EVADING;

                state.evade.phaseElapsedMs =
                    0;

                state.evade.cooldownRemainingMs =
                    5000;

                dispenser.phase =
                    SHIP_WEAPON_PHASE
                        .DISPENSING;

                dispenser.phaseElapsedMs =
                    0;

                dispenser.cooldownRemainingMs =
                    0;

                dispenser.dispensedMineCount =
                    0;

                const ammoBefore =
                    dispenser.ammoCount;

                engine.step(
                    0,
                );

                const events =
                    engine.drainEvents();

                expect(
                    dispenser.ammoCount,
                ).toBe(
                    ammoBefore - 1,
                );

                expect(
                    dispenser.dispensedMineCount,
                ).toBe(
                    1,
                );

                expect(
                    dispenser.cooldownRemainingMs,
                ).toBe(
                    definition
                        .cooldownDurationMs,
                );

                expect(
                    state.combat
                        .stickyMines,
                ).toEqual([]);

                expect(
                    events,
                ).toContainEqual({
                    type:
                        ENCOUNTER_EVENT
                            .STICKY_MINE_MISSED_PLAYER_SHIP,

                    sourceActorId:
                        enemy.id,

                    sourceWeaponId:
                        dispenser.id,
                });

                expect(
                    events.some(
                        (event) => {
                            return (
                                event.type ===
                                ENCOUNTER_EVENT
                                    .STICKY_MINE_ATTACHED
                            );
                        },
                    ),
                ).toBe(
                    false,
                );
            },
        );
    },
);
