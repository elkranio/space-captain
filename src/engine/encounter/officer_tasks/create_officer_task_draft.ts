// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import { OFFICER_TASK_BASE_DURATION_MS } from '../../content/rules/officer_tasks';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import type { PointDefenseBeamBand } from '../../defs/point_defense';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type WeaponsPointDefenseCommandId,
} from '../model/command';
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from '../model/officer_task';

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

export function createSciencePurgeSpamTask(channelId: string): OfficerTaskDraft {
    return {
        kind: OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM,

        channelId,

        label: 'PURGE SPAM',
        showProgress: true,

        durationMs: OFFICER_TASK_BASE_DURATION_MS.SCIENCE_PURGE_SPAM,
    };
}

export function createScienceFireSpamTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND
                .SCIENCE_FIRE_SPAM,

        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_FIRE_SPAM,

        weaponId,
        targetActorId,

        label: 'SPAM PROJECT',
        showProgress: false,

        // PlayerSpamProjectorRunner releases Science
        // when the channel expires or is cancelled.
        durationMs: null,
    };
}

export function createEngineerRepairDriveTask(): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

        label: 'REPAIR ENGINE',
        showProgress: true,

        durationMs:
            OFFICER_TASK_BASE_DURATION_MS.ENGINEER_REPAIR_DRIVE,
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

export function createWeaponsFireMissileTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_MISSILE,

        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

        weaponId,
        targetActorId,

        label: 'MISSILE AIM',
        showProgress: false,

        // Atom 2 завершит task через
        // player weapon lifecycle.
        durationMs: null,
    };
}

export function createWeaponsFireStickyMinesTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES,

        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES,

        weaponId,
        targetActorId,

        label: 'MINE SALVO',
        showProgress: false,

        // PlayerWeaponRunner завершает task
        // после последней реально запущенной мины.
        durationMs: null,
    };
}

export function createWeaponsFireLaserTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER,

        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        weaponId,
        targetActorId,

        label: 'LASER AIM',
        showProgress: false,

        // Завершится через player weapon
        // lifecycle, а не обычный timer.
        durationMs: null,
    };
}

export function createClearStickyMineTask(
    role: OfficerRole,
    mineId: string,
): OfficerTaskDraft {
    return {
        kind:
            OFFICER_TASK_KIND.CLEAR_STICKY_MINE,
        role,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,

        mineId,

        label: 'CLEAR MINE',
        showProgress: true,

        durationMs:
            OFFICER_TASK_BASE_DURATION_MS.CLEAR_STICKY_MINE,
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
