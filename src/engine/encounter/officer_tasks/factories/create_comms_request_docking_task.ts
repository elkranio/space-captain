// src/engine/encounter/officer_tasks/factories/create_comms_request_docking_task.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../../model/officer_task';

const REQUEST_DOCKING_BASE_DURATION_MS = 3000;

// Создаёт draft запроса docking clearance.
//
// Runtime id назначает OfficerTaskRunner
// в момент запуска task.
export function createCommsRequestDockingTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING,

        role: OFFICER_ROLE.COMMS,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING,

        targetId,

        label: 'REQ DOCK',

        elapsedMs: 0,

        durationMs: REQUEST_DOCKING_BASE_DURATION_MS,
    };
}
