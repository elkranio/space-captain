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
import { OFFICER_TASK_KIND, type OfficerTaskState } from '../../src/engine/encounter/model/officer_task';
import BridgeOfficerStationsController from '../../src/app/scenes/game/bridge/controller/encounter/officer_stations/BridgeOfficerStationsController';
import {
    BRIDGE_EVENT,
    type BridgeOfficerActivityProgressUpdatedPayload,
    type BridgeOfficerStationIndicatorsUpdatedPayload,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

const OFFICER_ROLES = Object.values(OFFICER_ROLE);

describe('BridgeOfficerStationsController', () => {
    it('emits lamp snapshots periodically and task progress every step', () => {
        const availabilityStates = createAvailabilityStates();

        const tasks = createOfficerTasks();

        const getOfficerAvailabilityStates = vi.fn(() => {
            return availabilityStates;
        });

        const getOfficerTasks = vi.fn(() => {
            return tasks.map((task) => {
                return {
                    ...task,
                };
            });
        });

        const encounterEngine = {
            getOfficerAvailabilityStates,
            getOfficerTasks,
        } as unknown as EncounterEngine;

        const emit = vi.fn();

        const eventBus = {
            emit,
        } as unknown as BridgeEventBus;

        const controller = new BridgeOfficerStationsController(encounterEngine, eventBus);

        controller.sync();

        expect(emit.mock.calls).toEqual([
            [BRIDGE_EVENT.OFFICER_STATION_INDICATORS_UPDATED, createReadyIndicatorStates()],

            [BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED, createExpectedProgressStates(0.5)],
        ]);

        emit.mockClear();

        // Двигаем только runtime task state,
        // которое вернёт следующий engine query.
        tasks[0].elapsedMs = 1800;

        controller.step(16);

        // За 16 ms lamp polling ещё не срабатывает,
        // но progress уже обновляется.
        expect(emit.mock.calls).toEqual([
            [BRIDGE_EVENT.OFFICER_ACTIVITY_PROGRESS_UPDATED, createExpectedProgressStates(0.6)],
        ]);

        expect(getOfficerAvailabilityStates).toHaveBeenCalledTimes(1);

        expect(getOfficerTasks).toHaveBeenCalledTimes(2);
    });
});

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

            targetId: 'projectile_1',

            pointDefenseBeamBand: POINT_DEFENSE_BEAM_BAND.RED,

            label: 'PD AIM',
            showProgress: true,

            durationMs: 3000,
            elapsedMs: 1500,
        },

        {
            id: 'task_science',

            kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,

            role: OFFICER_ROLE.SCIENCE,

            sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

            targetNodeId: 'node_destination',

            label: 'PLOT COURSE',

            // Timed task, но UI progress
            // для неё отключён.
            showProgress: false,

            durationMs: 5000,
            elapsedMs: 2500,
        },
    ];
}
