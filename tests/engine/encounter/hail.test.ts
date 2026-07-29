// tests/engine/encounter/hail.test.ts

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
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';
import { createPointDefenseFixture } from '../../fixtures/engine/point_defense_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('HAIL', () => {
    it('keeps Comms busy until the contact sequence ends', () => {
        const { node, stationId, stationName, stationContactName } = createSingleStationNodeFixture();

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

        expect(engine.getAvailableCommands(OFFICER_ROLE.COMMS)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

            label: 'HAIL',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },

            targetLabel: stationName,
        });

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.COMMS,

            commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },
        });

        expect(executionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        expect(engine.getAvailableCommands(OFFICER_ROLE.COMMS)).toEqual([]);

        const startedEvents = engine.drainEvents();

        expect(startedEvents).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_STARTED,

                task: expect.objectContaining({
                    kind: OFFICER_TASK_KIND.COMMS_HAIL,

                    role: OFFICER_ROLE.COMMS,

                    sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

                    targetAnchorId: stationId,

                    label: 'HAIL',
                    durationMs: null,
                    elapsedMs: 0,
                }),
            }),
        ]);

        const taskStartedEvent = startedEvents[0];

        if (taskStartedEvent.type !== ENCOUNTER_EVENT.OFFICER_TASK_STARTED) {
            throw new Error('Expected HAIL officer task');
        }

        const taskId = taskStartedEvent.task.id;

        // ContactSequenceRunner обрабатывает первый шаг
        // только на следующем engine step.
        engine.step(0);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.CONTACT_STARTED,

                contactName: stationContactName,
            }),
        ]);

        engine.step(800);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,

                speakerName: stationContactName,
            }),
        ]);

        engine.step(2500);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,

                speakerName: 'COMMS',
            }),
        ]);

        engine.step(2500);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type: ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,

                speakerName: stationContactName,
            }),
        ]);

        // Последний wait приводит к END_CONTACT.
        // Его callback завершает HAIL task в том же step.
        engine.step(2000);

        expect(engine.drainEvents()).toEqual([
            {
                type: ENCOUNTER_EVENT.CONTACT_ENDED,
            },

            expect.objectContaining({
                type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                outcome: OFFICER_TASK_OUTCOME.COMPLETED,

                task: expect.objectContaining({
                    id: taskId,

                    kind: OFFICER_TASK_KIND.COMMS_HAIL,

                    role: OFFICER_ROLE.COMMS,
                    targetAnchorId: stationId,
                }),
            }),
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.COMMS)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

            label: 'HAIL',

            target: {
                kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                anchorId: stationId,
            },

            targetLabel: stationName,
        });
    });

    it('consumes a large delta across the whole contact sequence', () => {
        const { node, stationId } = createSingleStationNodeFixture();

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

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.COMMS,

                commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

                target: {
                    kind: OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                    anchorId: stationId,
                },
            }),
        ).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        // Убираем OFFICER_TASK_STARTED.
        engine.drainEvents();

        // Имитируем большой frame delta после лага
        // или возвращения в активную вкладку.
        engine.step(100_000);

        expect(engine.drainEvents().map((event) => event.type)).toEqual([
            ENCOUNTER_EVENT.CONTACT_STARTED,

            ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
            ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,
            ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED,

            ENCOUNTER_EVENT.CONTACT_ENDED,
            ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
        ]);

        expect(engine.getAvailableCommands(OFFICER_ROLE.COMMS)).toContainEqual(
            expect.objectContaining({
                commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,
            }),
        );
    });
});
