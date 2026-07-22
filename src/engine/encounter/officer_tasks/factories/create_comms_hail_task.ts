// src/engine/encounter/officer_tasks/factories/create_comms_hail_task.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../../model/officer_task';

export function createCommsHailTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_HAIL,

        role: OFFICER_ROLE.COMMS,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HAIL,

        targetId,

        label: 'HAIL',

        elapsedMs: 0,

        // Task живёт столько же, сколько contact flow.
        // Завершение приходит извне через callback.
        durationMs: null,
    };
}
