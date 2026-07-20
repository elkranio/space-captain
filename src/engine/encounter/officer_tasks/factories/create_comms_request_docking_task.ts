// src/engine/encounter/officer_tasks/factories/create_comms_request_docking_task.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../model/command';
import { OFFICER_TASK_ID, type OfficerTaskState } from '../../model/officer_task';

const REQUEST_DOCKING_BASE_DURATION_MS = 3000;

// Создаёт task запроса docking clearance.
// Пока duration фиксированный; позже сюда добавятся модификаторы skill/stress/relationships/station traffic.
export function createCommsRequestDockingTask(targetId: string): OfficerTaskState {
    return {
        id: OFFICER_TASK_ID.COMMS_REQUEST_DOCKING,
        role: OFFICER_ROLE.COMMS,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.REQUEST_DOCKING,
        targetId,
        label: 'REQ DOCK',
        elapsedMs: 0,
        durationMs: REQUEST_DOCKING_BASE_DURATION_MS,
    };
}
