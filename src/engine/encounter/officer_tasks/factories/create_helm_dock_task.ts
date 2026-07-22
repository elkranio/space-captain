// src/engine/encounter/officer_tasks/factories/create_helm_dock_task.ts

import { OFFICER_ROLE } from '../../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../../model/officer_task';

export function createHelmDockTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_DOCK,

        role: OFFICER_ROLE.HELM,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.DOCK,

        targetId,

        label: 'DOCK',

        elapsedMs: 0,

        // Docking заканчивается внешним visual flow,
        // после которого encounter сменяется station scene.
        durationMs: null,
    };
}
