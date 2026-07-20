// src/engine/encounter/officer_tasks/resolve_finished_officer_tasks.ts

import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import { OFFICER_TASK_ID, type OfficerTaskState } from '../model/officer_task';
import type { EncounterState } from '../model/state';
import { grantDockingClearance } from '../state/grant_docking_clearance';
import { clearOfficerTask } from './clear_officer_task';

export type ResolveFinishedOfficerTasksContext = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
};

// Обрабатывает officer task-ы, которые дошли до конца.
// Сначала применяет результат task-а, потом очищает task и сообщает наружу.
export function resolveFinishedOfficerTasks(context: ResolveFinishedOfficerTasksContext): void {
    const finishedTasks = Object.values(context.state.officerTasks).filter(isOfficerTaskFinished);

    for (const task of finishedTasks) {
        resolveFinishedOfficerTask(context.state, task);

        clearOfficerTask(context.state, task.role);

        context.emit({
            type: ENCOUNTER_EVENT.OFFICER_TASK_ENDED,
            role: task.role,
            taskId: task.id,
        });
    }
}

function isOfficerTaskFinished(task?: OfficerTaskState): task is OfficerTaskState {
    if (!task) {
        return false;
    }

    return task.elapsedMs >= task.durationMs;
}

function resolveFinishedOfficerTask(state: EncounterState, task: OfficerTaskState): void {
    switch (task.id) {
        case OFFICER_TASK_ID.COMMS_REQUEST_DOCKING:
            resolveCommsRequestDockingTask(state, task);
            return;

        default:
            throw new Error(`Unhandled officer task: ${task.id}`);
    }
}

function resolveCommsRequestDockingTask(state: EncounterState, task: OfficerTaskState): void {
    if (!task.targetId) {
        throw new Error('COMMS_REQUEST_DOCKING task requires targetId');
    }

    grantDockingClearance(state, task.targetId);
}
