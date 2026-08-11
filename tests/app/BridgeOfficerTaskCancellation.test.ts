// tests/app/BridgeOfficerTaskCancellation.test.ts

import { describe, expect, it, vi } from 'vitest';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
} from '../../src/engine/encounter/model/command';
import { OFFICER_TASK_KIND } from '../../src/engine/encounter/model/officer_task';
import BridgeEncounterController from '../../src/app/scenes/game/bridge/controller/encounter/BridgeEncounterController';
import BridgeOfficerCommandMenuController from '../../src/app/scenes/game/bridge/controller/encounter/command_menu/BridgeOfficerCommandMenuController';
import {
    BRIDGE_EVENT,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

describe('Bridge officer task cancellation', () => {
    it('keeps task cancellation out of the legacy officer menu', () => {
        const encounterEngine = {
            getOfficerTasks: vi.fn(() => {
                return [
                    {
                        id: 'task_engineer',

                        kind:
                            OFFICER_TASK_KIND
                                .ENGINEER_REPAIR_DRIVE,

                        role:
                            OFFICER_ROLE.ENGINEER,

                        sourceCommandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .ENGINEER_REPAIR_DRIVE,

                        label: 'REPAIR DRIVE',
                        showProgress: true,

                        durationMs: 12000,
                        elapsedMs: 500,

                        canBeCancelledByPlayer: true,
                        canBeInterruptedByDamage: true,
                    },
                ];
            }),

            getAvailableCommands:
                vi.fn(() => []),
        } as unknown as EncounterEngine;

        const emit = vi.fn();

        const controller =
            new BridgeOfficerCommandMenuController(
                encounterEngine,

                {
                    emit,
                } as unknown as BridgeEventBus,
            );

        controller.open(
            OFFICER_ROLE.ENGINEER,
        );

        expect(
            emit,
        ).toHaveBeenCalledWith(
            BRIDGE_EVENT
                .OFFICER_COMMAND_MENU_UPDATED,

            {
                role:
                    OFFICER_ROLE.ENGINEER,

                groups: [],
            },
        );
    });

    it('routes direct station cancel input through encounter orchestration', () => {
        const lifecycle: string[] = [];

        const cancelTask =
            vi.fn(() => {
                lifecycle.push('cancel');
            });

        const drainEvents =
            vi.fn(() => {
                lifecycle.push('drain');
                return [];
            });

        const syncPlayerShipDashboard =
            vi.fn(() => {
                lifecycle.push('dashboard');
            });

        const syncStations =
            vi.fn(() => {
                lifecycle.push('stations');
            });

        const on = vi.fn();

        const eventBus = {
            on,
            off: vi.fn(),
            emit: vi.fn(),
        } as unknown as BridgeEventBus;

        const controller =
            new BridgeEncounterController(
                eventBus,
            );

        const testable =
            controller as unknown as {
                registerBridgeEventHandlers():
                    void;

                isEncounterInteractive:
                    boolean;

                encounterEngine:
                    EncounterEngine;

                snapshotSynchronizer: {
                    syncPlayerShipDashboard():
                        void;
                };

                officerStationsController: {
                    sync(): void;
                };
            };

        testable.encounterEngine = {
            cancelTask,
            drainEvents,
        } as unknown as EncounterEngine;

        testable.snapshotSynchronizer = {
            syncPlayerShipDashboard,
        };

        testable.officerStationsController = {
            sync: syncStations,
        };

        testable.isEncounterInteractive = true;

        testable.registerBridgeEventHandlers();

        const registration =
            on.mock.calls.find(
                ([event]) => {
                    return (
                        event ===
                        BRIDGE_EVENT
                            .OFFICER_TASK_CANCEL_SELECTED
                    );
                },
            );

        if (!registration) {
            throw new Error(
                'Direct officer task cancel listener was not registered',
            );
        }

        const [
            ,
            callback,
            context,
        ] = registration;

        callback.call(
            context,
            {
                taskId:
                    'task_engineer',
            },
        );

        expect(
            cancelTask,
        ).toHaveBeenCalledWith(
            'task_engineer',
        );

        expect(
            lifecycle,
        ).toEqual([
            'cancel',
            'drain',
            'dashboard',
            'stations',
        ]);
    });
});
