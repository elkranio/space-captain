// src/engine/encounter/officer_tasks/factories/create_helm_fly_to_task.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskState } from '../../model/officer_task';

export function createHelmFlyToTask(targetId: string): OfficerTaskState {
    return {
        // Временное значение.
        //
        // OfficerTaskRunner заменяет его
        // на уникальный runtime ID.
        id: OFFICER_TASK_KIND.HELM_FLY_TO,

        kind: OFFICER_TASK_KIND.HELM_FLY_TO,

        role: OFFICER_ROLE.HELM,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.FLY_TO,

        targetId,

        label: 'FLY TO',

        elapsedMs: 0,

        // Task завершается после окончания
        // визуального travel flow.
        durationMs: null,
    };
}
