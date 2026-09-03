// tests/engine/encounter/fly_to.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { describe, expect, it } from 'vitest';
import {
    SHIP_WEAPONS,
} from '../../../src/engine/content/catalogs/ship_weapons';
import { SHIP_NODE_ACTOR_PRESET_ID } from '../../../src/engine/content/presets/ship_node_actors';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import { getMutableEncounterStateForTest } from './get_mutable_encounter_state_for_test';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import { ENCOUNTER_EVENT, OFFICER_TASK_OUTCOME } from '../../../src/engine/encounter/model/event';
import { OFFICER_AVAILABILITY_STATE } from '../../../src/engine/encounter/model/officer_availability';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { createStationAndBeaconNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import ShipNodeActorFactory from '../../../src/engine/generation/space_node_actor/ShipNodeActorFactory';

describe('FLY_TO', () => {
    it('travels between encounter anchors and blocks the bridge until completion', () => {
        const { node, stationId, stationName, beaconId, beaconName } = createStationAndBeaconNodeFixture();

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        // Убираем начальный ENCOUNTER_LOADED.
        engine.drainEvents();

        expect(engine.getAvailableCommands(OFFICER_ROLE.HELM)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: beaconId,
            },
        });

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.HELM,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: beaconId,
            },
        });

        expect(executionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getNavigationState()).toEqual({
            kind: PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING,

            fromAnchorId: stationId,
            targetAnchorId: beaconId,
        });

        expect(engine.getOfficerAvailabilityStates()).toEqual({
            [OFFICER_ROLE.SCIENCE]: OFFICER_AVAILABILITY_STATE.BLOCKED,

            [OFFICER_ROLE.HELM]: OFFICER_AVAILABILITY_STATE.BUSY,

            [OFFICER_ROLE.WEAPONS]: OFFICER_AVAILABILITY_STATE.UNAVAILABLE,

            [OFFICER_ROLE.ENGINEER]: OFFICER_AVAILABILITY_STATE.UNAVAILABLE,
        });

        const startedEvents = engine.drainEvents();

        expect(startedEvents).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.HELM_FLY_TO,

                    role: OFFICER_ROLE.HELM,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

                    targetAnchorId: beaconId,
                    label: 'FLY TO',
                    durationMs: null,
                    elapsedMs: 0,
                }),
            }),

            expect.objectContaining({
                type: ENCOUNTER_EVENT.TRAVEL_STARTED,
                taskId: expect.any(String),
                fromAnchorId: stationId,

                target: expect.objectContaining({
                    id: beaconId,
                    displayName: beaconName,
                }),
            }),
        ]);

        const travelStartedEvent = startedEvents.find((event) => {
            return event.type === ENCOUNTER_EVENT.TRAVEL_STARTED;
        });

        if (!travelStartedEvent || travelStartedEvent.type !== ENCOUNTER_EVENT.TRAVEL_STARTED) {
            throw new Error('Expected TRAVEL_STARTED event');
        }

        expect(() => {
            engine.completeJump(travelStartedEvent.taskId);
        }).toThrow(
            `Cannot complete officer task ` +
                `${travelStartedEvent.taskId}: ` +
                `expected ${OFFICER_TASK_KIND.HELM_JUMP}, ` +
                `received ${OFFICER_TASK_KIND.HELM_FLY_TO}`,
        );

        engine.completeTravel(travelStartedEvent.taskId);

        expect(engine.getNavigationState()).toEqual({
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

            anchorId: beaconId,
        });

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                task: expect.objectContaining({
                    id: travelStartedEvent.taskId,

                    kind: OFFICER_TASK_KIND.HELM_FLY_TO,

                    role: OFFICER_ROLE.HELM,
                    targetAnchorId: beaconId,
                }),
            }),
        ]);

        expect(engine.getOfficerAvailabilityStates()).toEqual({
            [OFFICER_ROLE.SCIENCE]: OFFICER_AVAILABILITY_STATE.AVAILABLE,

            [OFFICER_ROLE.HELM]: OFFICER_AVAILABILITY_STATE.AVAILABLE,

            [OFFICER_ROLE.WEAPONS]: OFFICER_AVAILABILITY_STATE.UNAVAILABLE,

            [OFFICER_ROLE.ENGINEER]: OFFICER_AVAILABILITY_STATE.UNAVAILABLE,
        });

        expect(engine.getAvailableCommands(OFFICER_ROLE.HELM)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

            label: 'FLY TO',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },

            targetLabel: stationName,
        });
    });

    it('clears a charging beamCannon when the player leaves its combat zone', () => {
        const {
            node,
            stationId,
            beaconId,
        } = createStationAndBeaconNodeFixture();

        node.actors.push(
            ShipNodeActorFactory.create({
                id: 'ship_enemy_00',

                presetId:
                    SHIP_NODE_ACTOR_PRESET_ID
                        .ENEMY_GENERIC_BEAM_CANNON_00,

                anchorId: stationId,
            }),
        );

        const engine = new EncounterEngine({
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND
                        .ANCHORED,

                anchorId: stationId,
            },
        });

        const [loadedEvent] = engine.drainEvents();

        if (
            loadedEvent.type !==
            ENCOUNTER_EVENT.ENCOUNTER_LOADED
        ) {
            throw new Error(
                'Expected ENCOUNTER_LOADED event',
            );
        }

        const state =
            getMutableEncounterStateForTest(engine);

        const enemy =
            state.actors[0];
        const beamCannon = enemy?.weapons[0];

        if (
            !enemy ||
            !beamCannon ||
            beamCannon.kind !==
                SHIP_WEAPON_KIND.BEAM_CANNON
        ) {
            throw new Error(
                'Expected loaded enemy beamCannon',
            );
        }

        const beamCannonDefinition =
            SHIP_WEAPONS[beamCannon.weaponId];

        if (
            beamCannonDefinition.kind !==
            SHIP_WEAPON_KIND.BEAM_CANNON
        ) {
            throw new Error(
                'Expected beamCannon definition',
            );
        }

        engine.step(1);
        engine.drainEvents();

        engine.step(0);
        engine.drainEvents();

        expect(beamCannon.phase).toBe(
            SHIP_WEAPON_PHASE.CHARGING,
        );
        expect(engine.getBeamCannonAttacks()).toHaveLength(1);

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.HELM,

            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .HELM_FLY_TO,

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ANCHOR,

                anchorId: beaconId,
            },
        });

        expect(executionResult).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        expect(engine.getBeamCannonAttacks()).toEqual([]);

        expect(beamCannon).toMatchObject({
            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
        });

        expect(enemy.crewTasks).toEqual({});

        const travelStartedEvent =
            engine.drainEvents()
                .find((event) => {
                    return (
                        event.type ===
                        ENCOUNTER_EVENT.TRAVEL_STARTED
                    );
                });

        if (
            !travelStartedEvent ||
            travelStartedEvent.type !==
                ENCOUNTER_EVENT.TRAVEL_STARTED
        ) {
            throw new Error(
                'Expected TRAVEL_STARTED event',
            );
        }

        engine.completeTravel(
            travelStartedEvent.taskId,
        );
        engine.drainEvents();

        engine.step(
            beamCannonDefinition.chargeDurationMs,
        );

        expect(engine.drainEvents()).toEqual([]);
        expect(engine.getPlayerHullState()).toEqual(
            createPlayerHullFixture(),
        );
    });
});
