// src/engine/encounter/officer_availability/queries/get_officer_availability_states.ts

import { OFFICER_ROLE, type OfficerRole } from '../../../defs/officer';
import { getAvailableOfficerCommands } from '../../commands/get_available_officer_commands';
import type { EncounterState } from '../../model/state';
import {
    OFFICER_AVAILABILITY_STATE,
    type OfficerAvailabilityState,
    type OfficerAvailabilityStates,
} from '../../model/officer_availability';

const OFFICER_AVAILABILITY_ROLES = [
    OFFICER_ROLE.COMMS,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
] as const;

// Pure query доступности officers.
// Busy имеет приоритет над available; available означает, что у officer есть хотя бы одна полезная команда.
export function getOfficerAvailabilityStates(state: EncounterState): OfficerAvailabilityStates {
    const availabilityStates = {} as OfficerAvailabilityStates;

    for (const role of OFFICER_AVAILABILITY_ROLES) {
        availabilityStates[role] = getOfficerAvailabilityState(state, role);
    }

    return availabilityStates;
}

function getOfficerAvailabilityState(state: EncounterState, role: OfficerRole): OfficerAvailabilityState {
    if (isOfficerBusy(state, role)) {
        return OFFICER_AVAILABILITY_STATE.BUSY;
    }

    const availableCommands = getAvailableOfficerCommands(state, role);

    if (availableCommands.length > 0) {
        return OFFICER_AVAILABILITY_STATE.AVAILABLE;
    }

    return OFFICER_AVAILABILITY_STATE.UNAVAILABLE;
}

function isOfficerBusy(_state: EncounterState, _role: OfficerRole): boolean {
    return false;
}
