// tests/app/BridgeOfficerStationsController.test.ts

import { describe, expect, it, vi } from 'vitest';
import { OFFICER_ROLE } from '../../src/engine/defs/officer';
import { POINT_DEFENSE_BEAM_BAND } from '../../src/engine/defs/point_defense';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../src/engine/encounter/model/command';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityStates,
} from '../../src/engine/encounter/model/officer_availability';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../src/engine/encounter/model/officer_task';
import type {
    CombatPresentationSnapshot,
} from '../../src/engine/encounter/snapshots/combat_presentation_snapshot';
import BridgeOfficerStationsController from '../../src/app/scenes/game/bridge/controller/encounter/officer_stations/BridgeOfficerStationsController';
import {
    BRIDGE_EVENT,
    type BridgeOfficerActivityProgressUpdatedPayload,
    type BridgeOfficerCombatHintsUpdatedPayload,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

const OFFICER_ROLES = Object.values(OFFICER_ROLE);

describe('BridgeOfficerStationsController', () => {
    it('uses one supplied combat snapshot for lamps, hints and task progress', () => {
        const availabilityStates = createAvailabilityStates();
        const tasks = createOfficerTasks();

        const snapshot =
            createStationSnapshot({
                availabilityStates,
                tasks,
                enemyShips: [],
            });

        const getCombatPresentationSnapshot =
            vi.fn(() => {
                return snapshot;
            });

        const encounterEngine = {
            getCombatPresentationSnapshot,
        } as unknown as EncounterEngine;

        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const controller =
            new BridgeOfficerStationsController(
                encounterEngine,
                eventBus,
            );

        controller.sync(
            snapshot,
        );

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
                createReadyIndicatorStates(),
            ],

            [
                BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED,
                createEmptyCombatHintStates(),
            ],

            [
                BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,
                createExpectedProgressStates(0.5),
            ],
        ]);

        emit.mockClear();

        tasks[0].elapsedMs = 1800;

        controller.step(
            16,
            snapshot,
        );

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED,
                createExpectedProgressStates(0.6),
            ],
        ]);

        expect(
            getCombatPresentationSnapshot,
        ).not.toHaveBeenCalled();
    });

    it('maps availability and command hints from the default combat snapshot read', () => {
        const snapshot =
            createStationSnapshot({
                availabilityStates: {
                    [OFFICER_ROLE.SCIENCE]:
                        OFFICER_AVAILABILITY_STATE.UNAVAILABLE,

                    [OFFICER_ROLE.HELM]:
                        OFFICER_AVAILABILITY_STATE.AVAILABLE,

                    [OFFICER_ROLE.WEAPONS]:
                        OFFICER_AVAILABILITY_STATE.BUSY,

                    [OFFICER_ROLE.ENGINEER]:
                        OFFICER_AVAILABILITY_STATE.BLOCKED,
                },

                tasks: [],

                enemyShips: [
                    {
                        hull: {
                            current: 10,
                            max: 10,
                        },
                    },
                ],

                commandsByRole: {
                    [OFFICER_ROLE.SCIENCE]:
                        [],

                    [OFFICER_ROLE.HELM]: [
                        {
                            commandId:
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .HELM_FLY_TO,

                            label:
                                'FLY TO',

                            target: {
                                kind:
                                    'anchor',

                                anchorId:
                                    'escape_anchor',
                            },
                        },
                    ],

                    [OFFICER_ROLE.WEAPONS]:
                        [],

                    [OFFICER_ROLE.ENGINEER]:
                        [],
                },
            });

        const getCombatPresentationSnapshot =
            vi.fn(() => {
                return snapshot;
            });

        const encounterEngine = {
            getCombatPresentationSnapshot,
        } as unknown as EncounterEngine;

        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const controller =
            new BridgeOfficerStationsController(
                encounterEngine,
                eventBus,
            );

        controller.sync();

        expect(emit.mock.calls[0]).toEqual([
            BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED,
            {
                [OFFICER_ROLE.SCIENCE]: 'off',
                [OFFICER_ROLE.HELM]: 'ready',
                [OFFICER_ROLE.WEAPONS]: 'busy',
                [OFFICER_ROLE.ENGINEER]: 'blocked',
            },
        ]);

        expect(emit.mock.calls[1]).toEqual([
            BRIDGE_EVENT.OFFICER_COMBAT_HINTS_UPDATED,
            {
                [OFFICER_ROLE.SCIENCE]: [],
                [OFFICER_ROLE.HELM]: ['ESCAPE'],
                [OFFICER_ROLE.WEAPONS]: [],
                [OFFICER_ROLE.ENGINEER]: [],
            },
        ]);

        expect(
            getCombatPresentationSnapshot,
        ).toHaveBeenCalledTimes(1);
    });
});

type StationSnapshotOptions = {
    availabilityStates:
        OfficerAvailabilityStates;

    tasks:
        OfficerTaskState[];

    enemyShips?:
        Array<{
            hull: {
                current: number;
                max: number;
            };
        }>;

    commandsByRole?:
        CombatPresentationSnapshot[
            'commandsByRole'
        ];
};

function createStationSnapshot({
    availabilityStates,
    tasks,
    enemyShips = [],
    commandsByRole =
        createEmptyCommandsByRole(),
}: StationSnapshotOptions):
    CombatPresentationSnapshot {
    return {
        player: {
            officerAvailability:
                availabilityStates,

            officerTasks:
                tasks,
        },

        enemyShips,
        commandsByRole,
    } as unknown as CombatPresentationSnapshot;
}

function createEmptyCommandsByRole():
    CombatPresentationSnapshot[
        'commandsByRole'
    ] {
    return {
        [OFFICER_ROLE.SCIENCE]: [],
        [OFFICER_ROLE.HELM]: [],
        [OFFICER_ROLE.WEAPONS]: [],
        [OFFICER_ROLE.ENGINEER]: [],
    };
}

function createAvailabilityStates(): OfficerAvailabilityStates {
    return Object.fromEntries(
        OFFICER_ROLES.map((role) => {
            return [role, OFFICER_AVAILABILITY_STATE.AVAILABLE];
        }),
    ) as OfficerAvailabilityStates;
}

function createReadyIndicatorStates(): BridgeOfficerStationIndicatorsUpdatedPayload {
    return Object.fromEntries(
        OFFICER_ROLES.map((role) => {
            return [role, 'ready'];
        }),
    ) as BridgeOfficerStationIndicatorsUpdatedPayload;
}

function createEmptyCombatHintStates(): BridgeOfficerCombatHintsUpdatedPayload {
    const states = {} as BridgeOfficerCombatHintsUpdatedPayload;

    for (const role of OFFICER_ROLES) {
        states[role] = [];
    }

    return states;
}

function createExpectedProgressStates(weaponsProgress: number): BridgeOfficerActivityProgressUpdatedPayload {
    const states = Object.fromEntries(
        OFFICER_ROLES.map((role) => {
            return [role, null];
        }),
    ) as BridgeOfficerActivityProgressUpdatedPayload;

    states[OFFICER_ROLE.WEAPONS] = weaponsProgress;

    return states;
}

function createOfficerTasks(): OfficerTaskState[] {
    return [
        {
            id: 'task_weapons',

            kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,

            role: OFFICER_ROLE.WEAPONS,

            sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_RED_BEAM,

            threatId: 'projectile_1',

            pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

            label: 'PD AIM',
            showProgress: true,

            durationMs: 3000,
            elapsedMs: 1500,

            canBeCancelledByPlayer: true,
            canBeInterruptedByDamage: true,
        },

        {
            id: 'task_science',

            kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,

            role: OFFICER_ROLE.SCIENCE,

            sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

            targetNodeId: 'node_destination',

            label: 'PLOT COURSE',

            showProgress: false,

            durationMs: 5000,
            elapsedMs: 2500,

            canBeCancelledByPlayer: true,
            canBeInterruptedByDamage: true,
        },
    ];
}
