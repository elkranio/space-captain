// tests/engine/encounter/dock.test.ts

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
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createSingleStationNodeFixture } from '../../fixtures/engine/space_node_fixtures';

describe('DOCK', () => {
    it('is available immediately at the current station', () => {
        const {
            node,
            stationId,
        } = createSingleStationNodeFixture();

        const engine = new EncounterEngine({
            random: () => 0.5,
            playerHull: createPlayerHullFixture(),
            drive: createShipDriveFixture(),
            node,

            navigation: {
                kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
                anchorId: stationId,
            },
        });

        engine.drainEvents();

        expect(
            engine.getAvailableCommands(
                OFFICER_ROLE.PILOT,
            ),
        ).toContainEqual({
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID
                    .PILOT_DOCK,

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND
                        .ANCHOR,

                anchorId: stationId,
            },
        });

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.PILOT,

                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID
                        .PILOT_DOCK,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND
                            .ANCHOR,

                    anchorId: stationId,
                },
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS
                    .EXECUTED,
        });

        const events = engine.drainEvents();

        expect(events).toEqual([
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .OFFICER_TASK_STARTED,

                task: expect.objectContaining({
                    kind:
                        OFFICER_TASK_KIND
                            .PILOT_DOCK,

                    role: OFFICER_ROLE.PILOT,
                    targetAnchorId: stationId,
                }),
            }),

            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT
                        .DOCKING_STARTED,

                targetId: stationId,
            }),
        ]);
    });
});
