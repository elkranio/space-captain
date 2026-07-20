// src/engine/encounter/officer_tasks/clear_officer_task.ts

import type { OfficerRole } from '../../defs/officer';
import type { EncounterState } from '../model/state';

// Очищает текущий task officer-а.
export function clearOfficerTask(state: EncounterState, role: OfficerRole): void {
    delete state.officerTasks[role];
}
