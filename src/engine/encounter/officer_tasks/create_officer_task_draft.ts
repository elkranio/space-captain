// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import { OFFICER_ROLE } from '../../defs/officer';
import { ENCOUNTER_OFFICER_COMMAND_ID } from '../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../model/officer_task';

const REQUEST_DOCKING_BASE_DURATION_MS = 3000;
const PLOT_COURSE_BASE_DURATION_MS = 5000;

export function createCommsHailTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_HAIL,
        role: OFFICER_ROLE.COMMS,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,
        targetId,
        label: 'HAIL',

        // Завершается вместе с contact flow.
        durationMs: null,
    };
}

export function createCommsRequestDockingTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING,
        role: OFFICER_ROLE.COMMS,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING,
        targetId,
        label: 'REQ DOCK',
        durationMs: REQUEST_DOCKING_BASE_DURATION_MS,
    };
}

export function createSciencePlotCourseTask(): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,
        role: OFFICER_ROLE.SCIENCE,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,
        label: 'PLOT COURSE',
        durationMs: PLOT_COURSE_BASE_DURATION_MS,
    };
}

export function createHelmDockTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_DOCK,
        role: OFFICER_ROLE.HELM,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK,
        targetId,
        label: 'DOCK',

        // Завершается внешним docking visual flow.
        durationMs: null,
    };
}

export function createHelmFlyToTask(targetId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_FLY_TO,
        role: OFFICER_ROLE.HELM,
        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,
        targetId,
        label: 'FLY TO',

        // Завершается внешним travel visual flow.
        durationMs: null,
    };
}
