// tests/app/BridgeOfficerTaskCancellationMenu.test.ts

import { describe, expect, it, vi } from 'vitest';
import { LASER_TARGET_ZONE } from '../../src/engine/defs/laser';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../src/engine/encounter/model/command';
import { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';
import BridgeOfficerCommandMenuController from '../../src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController';
import {
    BRIDGE_EVENT,
    type BridgeOfficerTaskCancelSelectedPayload,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

describe('BridgeOfficerCommandMenuController task cancellation', () => {
    it('shows CANCEL TASK and immediately redraws available commands after cancellation', () => {
        const task = {
            id: 'task_engineer',

            kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
            role: OFFICER_ROLE.ENGINEER,
            sourceCommandId:
                ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD_CENTER,

            shieldZone: LASER_TARGET_ZONE.CENTER,

            label: 'SHIELD CENTER',
            showProgress: true,

            durationMs: 2000,
            elapsedMs: 500,

            canBeCancelledByPlayer: true,
            canBeInterruptedByDamage: true,
        } as const;

        let activeTask = task;

        const cancelTask = vi.fn(() => {
            activeTask = undefined as never;
        });

        const encounterEngine = {
            getOfficerTasks: vi.fn(() => {
                return activeTask ? [activeTask] : [];
            }),

            getAvailableCommands: vi.fn(() => {
                return [
                    {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .ENGINEER_DEPLOY_SHIELD_LEFT,

                        label: 'SHIELD LEFT',

                        target: {
                            kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                        },
                    },
                ];
            }),

            cancelTask,
        } as unknown as EncounterEngine;

        const emit = vi.fn();

        const onEngineStateChanged =
            vi.fn();

        let cancelSelected:
            | ((payload: BridgeOfficerTaskCancelSelectedPayload) => void)
            | undefined;

        const eventBus = {
            on: vi.fn((event, callback, context) => {
                if (event !== BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED) {
                    return;
                }

                cancelSelected = (payload) => {
                    callback.call(context, payload);
                };
            }),

            emit,
        } as unknown as BridgeEventBus;

        const controller = new BridgeOfficerCommandMenuController(
            encounterEngine,
            eventBus,

            onEngineStateChanged,
        );

        controller.open(OFFICER_ROLE.ENGINEER);

        expect(emit.mock.calls.at(-1)).toEqual([
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED,

            {
                role: OFFICER_ROLE.ENGINEER,

                groups: [
                    {
                        label: 'TASK',

                        items: [
                            {
                                kind: 'cancel_task',

                                label: 'CANCEL TASK',
                                taskId: 'task_engineer',
                            },
                        ],
                    },
                ],
            },
        ]);

        if (!cancelSelected) {
            throw new Error('Cancel-task listener was not registered');
        }

        cancelSelected({
            role: OFFICER_ROLE.ENGINEER,
            taskId: 'task_engineer',
        });

        expect(cancelTask).toHaveBeenCalledWith('task_engineer');

        expect(
            onEngineStateChanged,
        ).toHaveBeenCalledTimes(1);

        expect(emit.mock.calls.at(-1)).toEqual([
            BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED,

            {
                role: OFFICER_ROLE.ENGINEER,

                groups: [
                    {
                        label: 'GENERAL',

                        items: [
                            {
                                kind: 'command',

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .ENGINEER_DEPLOY_SHIELD_LEFT,

                                label: 'SHIELD LEFT',

                                target: {
                                    kind: OFFICER_COMMAND_TARGET_KIND.NONE,
                                },
                            },
                        ],
                    },
                ],
            },
        ]);
    });
});
