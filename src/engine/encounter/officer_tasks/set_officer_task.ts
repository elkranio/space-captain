// src/engine/encounter/officer_tasks/set_officer_task.ts

import type { OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';

// Ставит officer-а в состояние выполнения task-а.
// Один officer сейчас может выполнять только один task одновременно.
export function setOfficerTask(state: EncounterState, task: OfficerTaskState): void {
    state.officerTasks[task.role] = task;
}
