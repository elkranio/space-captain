// tests/engine/encounter/plot_course.test.ts

import { describe, expect, it } from 'vitest';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
    OFFICER_COMMAND_REJECTION_REASON,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { ENCOUNTER_ANCHOR_KIND } from '../../../src/engine/encounter/anchors/encounter_anchor';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';

describe('PLOT_COURSE', () => {
    it('creates one jump point after the Science task completes', () => {
        const { node, stationId } = createSingleStationNodeFixture();

        const targetNodeId = 'node_destination';

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },

            pointDefense: createPointDefenseFixture(),
        });

        // Убираем начальный ENCOUNTER_LOADED.
        engine.drainEvents();

        expect(engine.getAvailableCommands(OFFICER_ROLE.SCIENCE)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

            label: 'PLOT COURSE',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.NONE,
            },
        });

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.SCIENCE,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.SPACE_NODE,

                nodeId: targetNodeId,
            },
        });

        expect(executionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        // Science занят расчётом курса.
        expect(engine.getAvailableCommands(OFFICER_ROLE.SCIENCE)).toEqual([]);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,

                    role: OFFICER_ROLE.SCIENCE,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

                    targetNodeId,
                    label: 'PLOT COURSE',
                    showProgress: false,
                    durationMs: 5000,
                    elapsedMs: 0,
                }),
            }),
        ]);

        engine.step(4999);

        expect(engine.drainEvents()).toEqual([]);

        engine.step(1);

        const endedEvents = engine.drainEvents();

        expect(endedEvents).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,

                    role: OFFICER_ROLE.SCIENCE,
                    targetNodeId,
                    elapsedMs: 5000,
                }),

                result: expect.objectContaining({
                    kind: OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED,

                    anchor: expect.objectContaining({
                        kind: ENCOUNTER_ANCHOR_KIND.JUMP_POINT,

                        displayName: 'JUMP POINT',

                        jumpPoint: expect.objectContaining({
                            targetNodeId,
                        }),
                    }),
                }),
            }),
        ]);

        const taskEndedEvent = endedEvents.find((event) => {
            return event.type === ENCOUNTER_EVENT.OFFICER_TASK_ENDED;
        });

        if (
            !taskEndedEvent ||
            taskEndedEvent.type !== ENCOUNTER_EVENT.OFFICER_TASK_ENDED ||
            taskEndedEvent.result?.kind !== OFFICER_TASK_RESULT_KIND.JUMP_POINT_CALCULATED
        ) {
            throw new Error('Expected completed PLOT COURSE task result');
        }

        const jumpPoint = taskEndedEvent.result.anchor;

        // Пока jump point уже существует,
        // новый курс построить нельзя.
        expect(engine.getAvailableCommands(OFFICER_ROLE.SCIENCE)).toEqual([]);

        // Рассчитанный jump point становится
        // обычной целью локального перелёта.
        expect(engine.getAvailableCommands(OFFICER_ROLE.HELM)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

            label: 'FLY TO',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: jumpPoint.id,
            },

            targetLabel: jumpPoint.displayName,
        });

        const duplicateExecutionResult = engine.executeCommand({
            role: OFFICER_ROLE.SCIENCE,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.SPACE_NODE,

                nodeId: 'another_destination',
            },
        });

        expect(duplicateExecutionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,

            reason: OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE,
        });

        expect(engine.drainEvents()).toEqual([]);
    });
});
