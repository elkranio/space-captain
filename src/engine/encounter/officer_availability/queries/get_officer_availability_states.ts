// src/engine/encounter/officer_availability/queries/get_officer_availability_states.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../defs/officer';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../../defs/player_location';
import { getAvailableOfficerCommands } from '../../commands/get_available_officer_commands';
import { getOfficerCommandDef } from '../../model/command';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
    type OfficerAvailabilityStates,
} from '../../model/officer_availability';
import type { OfficerTaskState } from '../../model/officer_task';
import type { EncounterState } from '../../model/state';

const OFFICER_AVAILABILITY_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

export function getOfficerAvailabilityStates(state: EncounterState): OfficerAvailabilityStates {
    const states = {} as OfficerAvailabilityStates;
    const exclusiveTask = findExclusiveBridgeOperationTask(state);
    const commandReferenceState = createCommandReferenceState(state, exclusiveTask);

    for (const role of OFFICER_AVAILABILITY_ROLES) {
        states[role] = getOfficerAvailabilityState(state, commandReferenceState, role, exclusiveTask !== undefined);
    }

    return states;
}

function getOfficerAvailabilityState(
    state: EncounterState,
    commandReferenceState: EncounterState,
    role: OfficerRole,
    exclusiveOperationActive: boolean,
): OfficerAvailabilityState {
    if (state.officerTasks[role]) {
        return OFFICER_AVAILABILITY_STATE.BUSY;
    }

    const commands = getAvailableOfficerCommands(commandReferenceState, role);

    if (commands.length === 0) {
        return OFFICER_AVAILABILITY_STATE.UNAVAILABLE;
    }

    if (exclusiveOperationActive) {
        return OFFICER_AVAILABILITY_STATE.BLOCKED;
    }

    return OFFICER_AVAILABILITY_STATE.AVAILABLE;
}

function findExclusiveBridgeOperationTask(state: EncounterState): OfficerTaskState | undefined {
    for (const task of Object.values(state.officerTasks)) {
        if (!task) {
            continue;
        }

        const commandDef = getOfficerCommandDef(task.sourceCommandId);

        if (commandDef.requiresIdleBridge) {
            return task;
        }
    }

    return undefined;
}

function createCommandReferenceState(
    state: EncounterState,
    exclusiveTask: OfficerTaskState | undefined,
): EncounterState {
    if (!exclusiveTask) {
        return state;
    }

    const navigation = state.navigation;

    if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.TRAVELLING) {
        return state;
    }

    return {
        ...state,
        navigation: {
            kind: PLAYER_SPACE_NAVIGATION_KIND.ANCHORED,
            anchorObjectId: navigation.fromObjectId,
        },
    };
}
