// src/engine/encounter/state/grant_docking_clearance.ts

import { ENCOUNTER_OBJECT_KIND } from '../objects/encounter_object';
import { DOCKING_CLEARANCE_STATE } from '../objects/station/station_encounter_object';
import type { EncounterState } from '../model/state';
import { findEncounterObjectById } from './find_encounter_object_by_id';

// Выдаёт docking clearance encounter object по runtime target id.
// State-level effect сам находит объект и делегирует mutation по object kind.
export function grantDockingClearance(state: EncounterState, targetId: string): void {
    const target = findEncounterObjectById(state, targetId);

    if (!target) {
        return;
    }

    switch (target.kind) {
        case ENCOUNTER_OBJECT_KIND.STATION:
            target.docking.clearance = DOCKING_CLEARANCE_STATE.GRANTED;
            return;
    }
}
