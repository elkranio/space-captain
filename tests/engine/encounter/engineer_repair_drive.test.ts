// tests/engine/encounter/engineer_repair_drive.test.ts

import { createPlayerHullFixture } from '../../fixtures/engine/player_hull_fixtures';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import { describe, expect, it } from 'vitest';
import { OFFICER_ROLE } from '../../../src/engine/defs/officer';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../src/engine/defs/player_location';
import {
    SHIP_DRIVE_ID,
    SHIP_DRIVE_STATUS,
} from '../../../src/engine/defs/ship_drive';
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
} from '../../../src/engine/encounter/model/event';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import { createShipDriveFixture } from '../../fixtures/engine/ship_drive_fixtures';
import { createStationAndBeaconNodeFixture } from '../../fixtures/engine/space_node_fixtures';

const REPAIR_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .ENGINEER_REPAIR_DRIVE,
    );
const PARTIAL_REPAIR_MS =
    Math.floor(
        REPAIR_DURATION_MS / 2,
    );

describe('Engineer repair drive command', () => {
    it('blocks drive-dependent Pilot commands and restores the drive after the configured repair duration', () => {
        const {
            node,
            stationId,
            beaconId,
        } = createStationAndBeaconNodeFixture();

        const engine = new EncounterEngine({
            random: () => 0.5,
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(
                SHIP_DRIVE_STATUS.DISABLED,
            ),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        engine.drainEvents();

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.PILOT,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO
                    );
                }),
        ).toBeUndefined();

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.PILOT,

                commandId:
                    ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO,

                target: {
                    kind:
                        OFFICER_COMMAND_TARGET_KIND.ANCHOR,

                    anchorId: beaconId,
                },
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS.REJECTED,

            reason:
                OFFICER_COMMAND_REJECTION_REASON.NOT_AVAILABLE,
        });

        const repairCommand = engine
            .getAvailableCommands(
                OFFICER_ROLE.ENGINEER,
            )
            .find((command) => {
                return (
                    command.commandId ===
                    ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE
                );
            });

        expect(repairCommand).toEqual({
            commandId:
                ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

            label: 'REPAIR ENGINE',

            target: {
                kind:
                    OFFICER_COMMAND_TARGET_KIND.NONE,
            },
        });

        if (!repairCommand) {
            throw new Error(
                'Expected REPAIR ENGINE command',
            );
        }

        expect(
            engine.executeCommand({
                role: OFFICER_ROLE.ENGINEER,

                commandId:
                    repairCommand.commandId,

                target: repairCommand.target,
            }),
        ).toEqual({
            status:
                OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
        });

        const [taskStartedEvent] =
            engine.drainEvents();

        if (
            taskStartedEvent.type !==
            ENCOUNTER_EVENT.OFFICER_TASK_STARTED
        ) {
            throw new Error(
                'Expected repair task started event',
            );
        }

        expect(taskStartedEvent.task).toMatchObject({
            kind:
                OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE,

            role: OFFICER_ROLE.ENGINEER,

            sourceCommandId:
                ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

            label: 'REPAIR ENGINE',
            showProgress: true,

            durationMs: REPAIR_DURATION_MS,
            elapsedMs: 0,

            canBeCancelledByPlayer: true,
            canBeInterruptedByDamage: true,
        });

        engine.step(REPAIR_DURATION_MS - 1);

        expect(engine.drainEvents()).toEqual([]);

        expect(engine.getDriveState().status).toBe(
            SHIP_DRIVE_STATUS.DISABLED,
        );

        engine.step(1);

        const [
            driveChangedEvent,
            taskEndedEvent,
        ] = engine.drainEvents();

        expect(driveChangedEvent).toEqual({
            type:
                ENCOUNTER_EVENT.PLAYER_SHIP_DRIVE_STATE_CHANGED,

            drive: {
                id: 'drive_player_00',
                driveId:
                    SHIP_DRIVE_ID.BASIC_00,
                integrity: 2,
                status:
                    SHIP_DRIVE_STATUS.ONLINE,
            },
        });

        expect(taskEndedEvent).toMatchObject({
            type:
                ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

            task: {
                id: taskStartedEvent.task.id,

                kind:
                    OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE,

                elapsedMs: REPAIR_DURATION_MS,
                durationMs: REPAIR_DURATION_MS,
            },

            outcome:
                OFFICER_TASK_OUTCOME.COMPLETED,
        });

        expect(engine.getDriveState().status).toBe(
            SHIP_DRIVE_STATUS.ONLINE,
        );

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.ENGINEER,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                        ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE
                    );
                }),
        ).toBeUndefined();

        expect(
            engine
                .getAvailableCommands(
                    OFFICER_ROLE.PILOT,
                )
                .find((command) => {
                    return (
                        command.commandId ===
                            ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO &&
                        command.target.kind ===
                            OFFICER_COMMAND_TARGET_KIND.ANCHOR &&
                        command.target.anchorId ===
                            beaconId
                    );
                }),
        ).toBeDefined();
    });

    it('loses all repair progress when the task is cancelled', () => {
        const {
            node,
            stationId,
        } = createStationAndBeaconNodeFixture();

        const engine = new EncounterEngine({
            random: () => 0.5,
            playerHull: createPlayerHullFixture(),

            drive: createShipDriveFixture(
                SHIP_DRIVE_STATUS.DISABLED,
            ),

            node,

            navigation: {
                kind:
                    PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,

                anchorId: stationId,
            },
        });

        engine.drainEvents();

        const firstTaskId =
            startRepair(engine);

        engine.step(PARTIAL_REPAIR_MS);

        expect(engine.getOfficerTasks()).toEqual([
            expect.objectContaining({
                id: firstTaskId,

                kind:
                    OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE,

                elapsedMs: PARTIAL_REPAIR_MS,
                durationMs: REPAIR_DURATION_MS,
            }),
        ]);

        engine.cancelTask(firstTaskId);

        expect(engine.drainEvents()).toEqual([
            expect.objectContaining({
                type:
                    ENCOUNTER_EVENT.OFFICER_TASK_ENDED,

                task: expect.objectContaining({
                    id: firstTaskId,
                    elapsedMs: PARTIAL_REPAIR_MS,
                }),

                outcome:
                    OFFICER_TASK_OUTCOME.CANCELLED,
            }),
        ]);

        const secondTaskId =
            startRepair(engine);

        expect(secondTaskId).not.toBe(firstTaskId);

        engine.step(PARTIAL_REPAIR_MS);

        expect(engine.getDriveState().status).toBe(
            SHIP_DRIVE_STATUS.DISABLED,
        );

        expect(engine.getOfficerTasks()).toEqual([
            expect.objectContaining({
                id: secondTaskId,

                elapsedMs: PARTIAL_REPAIR_MS,
                durationMs: REPAIR_DURATION_MS,
            }),
        ]);

        expect(engine.drainEvents()).toEqual([]);
    });
});

function startRepair(
    engine: EncounterEngine,
): string {
    const command = engine
        .getAvailableCommands(
            OFFICER_ROLE.ENGINEER,
        )
        .find((candidate) => {
            return (
                candidate.commandId ===
                ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE
            );
        });

    if (!command) {
        throw new Error(
            'Expected REPAIR ENGINE command',
        );
    }

    expect(
        engine.executeCommand({
            role: OFFICER_ROLE.ENGINEER,
            commandId: command.commandId,
            target: command.target,
        }),
    ).toEqual({
        status:
            OFFICER_COMMAND_EXECUTION_STATUS.EXECUTED,
    });

    const [event] = engine.drainEvents();

    if (
        event.type !==
        ENCOUNTER_EVENT.OFFICER_TASK_STARTED
    ) {
        throw new Error(
            'Expected repair task started event',
        );
    }

    return event.task.id;
}
