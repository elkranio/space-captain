// tests/engine/encounter/request_docking.test.ts

import { describe, expect, it } from 'vitest';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('REQUEST_DOCKING', () => {
    it('grants docking clearance after the Comms task completes', () => {
        const { node, stationId, stationName } = createSingleStationNodeFixture();

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        // Убираем начальный ENCOUNTER_LOADED.
        engine.drainEvents();

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.COMMS,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },
        });

        expect(executionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        // Comms занят активной task
        // и временно не предлагает команды.
        expect(engine.getAvailableCommands(OFFICER_ROLE.COMMS)).toEqual([]);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING,

                    role: OFFICER_ROLE.COMMS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING,

                    targetId: stationId,
                    label: 'REQ DOCK',
                    durationMs: 3000,
                    elapsedMs: 0,
                }),
            }),
        ]);

        engine.step(2999);

        expect(engine.drainEvents()).toEqual([]);

        engine.step(1);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING,

                    role: OFFICER_ROLE.COMMS,
                    targetId: stationId,
                    elapsedMs: 3000,
                }),

                result: {
                    kind: OFFICER_TASK_RESULT_KIND.DOCKING_CLEARANCE_GRANTED,

                    targetObjectId: stationId,
                },
            }),
        ]);

        const commsCommands = engine.getAvailableCommands(OFFICER_ROLE.COMMS);

        expect(
            commsCommands.some((command) => {
                return command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING;
            }),
        ).toBe(false);

        expect(engine.getAvailableCommands(OFFICER_ROLE.HELM)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK,

            label: 'DOCK',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },

            targetLabel: stationName,
        });
    });
});
