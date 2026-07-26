// tests/engine/encounter/fly_to.test.ts

import { describe, expect, it } from 'vitest';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import { ENCOUNTER_EVENT, OFFICER_TASK_OUTCOME } from '../../../src/engine/encounter/model/event';
import { OFFICER_AVAILABILITY_STATE } from '../../../src/engine/encounter/model/officer_availability';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { createStationAndBeaconNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('FLY_TO', () => {
    it('travels between encounter anchors and blocks the bridge until completion', () => {
        const { node, stationId, stationName, beaconId, beaconName } = createStationAndBeaconNodeFixture();

        const engine = new EncounterEngine({
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

            label: 'FLY TO',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: beaconId,
            },

            targetLabel: beaconName,
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
            [OFFICER_ROLE.COMMS]: OFFICER_AVAILABILITY_STATE.BLOCKED,

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

                    targetId: beaconId,
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
                    targetId: beaconId,
                }),
            }),
        ]);

        expect(engine.getOfficerAvailabilityStates()).toEqual({
            [OFFICER_ROLE.COMMS]: OFFICER_AVAILABILITY_STATE.UNAVAILABLE,

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
});
