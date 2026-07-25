// tests/engine/encounter/request_docking.test.ts
import { describe, expect, it } from 'vitest';
import { CHARACTER_PORTRAIT_ID } from '../../../src/engine/defs/character';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../src/engine/defs/player_location';
import { SPACE_BACKGROUND_ID } from '../../../src/engine/defs/space_background';
import { SPECIES_ID } from '../../../src/engine/defs/species';
import { STATION_OBJECT_SPRITE_ID } from '../../../src/engine/defs/station';
import { SPACE_OBJECT_KIND, type SpaceNodeState } from '../../../src/engine/defs/universe';
import EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_EXECUTION_STATUS,
} from '../../../src/engine/encounter/model/command';
import {
    ENCOUNTER_EVENT,
    OFFICER_TASK_OUTCOME,
    OFFICER_TASK_RESULT_KIND,
} from '../../../src/engine/encounter/model/event';
import { OFFICER_TASK_KIND } from '../../../src/engine/encounter/model/officer_task';

describe('REQUEST_DOCKING', () => {
    it('grants docking clearance after the Comms task completes', () => {
        const stationId = 'station_test';
        const stationName = 'TEST STATION';

        const node: SpaceNodeState = {
            id: 'node_test',

            position: {
                x: 0,
                y: 0,
            },

            arrivalObjectId: stationId,
            spaceBackgroundId: SPACE_BACKGROUND_ID.NEBULA_00,

            objects: [
                {
                    kind: SPACE_OBJECT_KIND.STATION,

                    station: {
                        id: stationId,
                        name: stationName,
                        originSpecies: SPECIES_ID.HUMAN,
                        objectSpriteId: STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_00,

                        contact: {
                            name: 'TEST OPERATOR',
                            portraitId: CHARACTER_PORTRAIT_ID.COMMS_HUMAN_00_CALM,
                        },
                    },

                    localPosition: {
                        x: 0,
                        y: 0,
                        z: 0,
                    },
                },
            ],
        };

        const engine = new EncounterEngine({
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorObjectId: stationId,
            },
        });

        // Убираем начальный ENCOUNTER_LOADED.
        engine.drainEvents();

        const executionResult = engine.executeCommand({
            role: OFFICER_ROLE.COMMS,
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING,
            targetId: stationId,
        });

        expect(executionResult).toEqual({
            status: OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        // Comms занят активной task и временно не предлагает команды.
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
            commsCommands.some((command) => command.commandId === ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING),
        ).toBe(false);

        expect(engine.getAvailableCommands(OFFICER_ROLE.HELM)).toContainEqual({
            commandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK,
            label: 'DOCK',
            targetId: stationId,
            targetLabel: stationName,
        });
    });
});
