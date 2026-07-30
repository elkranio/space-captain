// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import { OFFICER_TASK_BASE_DURATION_MS } from '../../content/rules/officer_tasks';
import type { LaserTargetZone } from '../../defs/laser';
import { OFFICER_ROLE } from '../../defs/officer';
import type { PointDefenseBeamBand } from '../../defs/point_defense';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type EngineerDeployShieldCommandId,
    type WeaponsPointDefenseCommandId,
} from '../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../model/officer_task';

export function createCommsHailTask(targetAnchorId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_HAIL,
        role: OFFICER_ROLE.COMMS,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL,

        targetAnchorId,

        label: 'HAIL',
        showProgress: false,

        // Завершается вместе с contact flow.
        durationMs: null,
    };
}

export function createCommsRequestDockingTask(targetAnchorId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING,
        role: OFFICER_ROLE.COMMS,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING,

        targetAnchorId,

        label: 'REQ DOCK',
        showProgress: false,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.COMMS_REQUEST_DOCKING,
    };
}

export function createSciencePlotCourseTask(targetNodeId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE,

        targetNodeId,

        label: 'PLOT COURSE',
        showProgress: false,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_PLOT_COURSE,
    };
}

export function createScienceIdentifyThreatTask(threatId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT,

        threatId,

        label: 'IDENTIFY',
        showProgress: true,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_IDENTIFY_THREAT,
    };
}

export function createEngineerDeployShieldTask(
    sourceCommandId: EngineerDeployShieldCommandId,
    shieldZone: LaserTargetZone,
): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId,

        shieldZone,

        label: `SHIELD ${shieldZone.toUpperCase()}`,
        showProgress: true,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.ENGINEER_DEPLOY_SHIELD,
    };
}

export function createWeaponsPointDefenseTask(
    sourceCommandId: WeaponsPointDefenseCommandId,
    threatId: string,
    pointDefenseBeamBand: PointDefenseBeamBand,
): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE,
        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId,

        threatId,
        pointDefenseBeamBand,

        label: 'PD AIM',
        showProgress: true,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.WEAPONS_POINT_DEFENSE_AIM,
    };
}

export function createHelmDockTask(targetAnchorId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_DOCK,
        role: OFFICER_ROLE.HELM,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK,

        targetAnchorId,

        label: 'DOCK',
        showProgress: false,

        // Завершается внешним docking visual flow.
        durationMs: null,
    };
}

export function createHelmFlyToTask(targetAnchorId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_FLY_TO,
        role: OFFICER_ROLE.HELM,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO,

        targetAnchorId,

        label: 'FLY TO',
        showProgress: false,

        // Завершается внешним travel visual flow.
        durationMs: null,
    };
}

export function createHelmJumpTask(targetAnchorId: string, targetNodeId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.HELM_JUMP,
        role: OFFICER_ROLE.HELM,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP,

        targetAnchorId,
        targetNodeId,

        label: 'JUMP',
        showProgress: false,

        // Завершается внешним jump visual flow.
        durationMs: null,
    };
}
