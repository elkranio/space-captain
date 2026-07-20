// src/engine/encounter/officer_availability/queries/get_officer_availability_states.ts
import { OFFICER_ROLE, type OfficerRole } from '../../../defs/officer';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
    type OfficerAvailabilityStates,
} from '../../model/officer_availability';
import type { EncounterState } from '../../model/state';
import { getAvailableOfficerCommands } from '../../commands/get_available_officer_commands';

const OFFICER_AVAILABILITY_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

export function getOfficerAvailabilityStates(state: EncounterState): OfficerAvailabilityStates {
    const states = {} as OfficerAvailabilityStates;

    for (const role of OFFICER_AVAILABILITY_ROLES) {
        states[role] = getOfficerAvailabilityState(state, role);
    }

    return states;
}

function getOfficerAvailabilityState(state: EncounterState, role: OfficerRole): OfficerAvailabilityState {
    if (state.officerTasks[role]) {
        return OFFICER_AVAILABILITY_STATE.BUSY;
    }

    const commands = getAvailableOfficerCommands(state, role);

    if (commands.length > 0) {
        return OFFICER_AVAILABILITY_STATE.AVAILABLE;
    }

    return OFFICER_AVAILABILITY_STATE.UNAVAILABLE;
}
