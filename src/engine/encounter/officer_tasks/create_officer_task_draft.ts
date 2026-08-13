// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import {
    getOfficerTaskDraftTuning,
} from '../../content/catalogs/officer_tasks';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import type { DefenseTurretBeamBand } from '../../defs/defense_turret';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type WeaponsDefenseTurretCommandId,
} from '../model/command';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskDraft,
} from '../model/officer_task';

export function createSciencePlotCourseTask(
    targetNodeId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .SCIENCE_PLOT_COURSE;

    return {
        kind,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_PLOT_COURSE,

        targetNodeId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createScienceIdentifyThreatTask(
    threatId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .SCIENCE_IDENTIFY_THREAT;

    return {
        kind,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_IDENTIFY_THREAT,

        threatId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createSciencePurgeSpamTask(
    channelId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .SCIENCE_PURGE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_PURGE_SPAM,

        channelId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createScienceFireSpamTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .SCIENCE_FIRE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENCE,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_FIRE_SPAM,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createEngineerRepairDriveTask(): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .ENGINEER_REPAIR_DRIVE;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .ENGINEER_REPAIR_DRIVE,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createEngineerDeployShieldTask(): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .ENGINEER_DEPLOY_SHIELD;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .ENGINEER_DEPLOY_SHIELD,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createWeaponsDefenseTurretTask(
    sourceCommandId:
        WeaponsDefenseTurretCommandId,
    threatId: string,
    defenseTurretBeamBand:
        DefenseTurretBeamBand,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .WEAPONS_DEFENSE_TURRET;

    return {
        kind,
        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId,

        threatId,
        defenseTurretBeamBand,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createWeaponsFireMissileTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .WEAPONS_FIRE_MISSILE;

    return {
        kind,
        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createWeaponsFireStickyMinesTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .WEAPONS_FIRE_STICKY_MINES;

    return {
        kind,
        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createWeaponsFireLaserTask(
    weaponId: string,
    targetActorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .WEAPONS_FIRE_LASER;

    return {
        kind,
        role: OFFICER_ROLE.WEAPONS,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_LASER,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createClearStickyMineTask(
    role: OfficerRole,
    mineId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND
            .CLEAR_STICKY_MINE;

    return {
        kind,
        role,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .CLEAR_STICKY_MINE,

        mineId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createHelmDockTask(
    targetAnchorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND.HELM_DOCK;

    return {
        kind,
        role: OFFICER_ROLE.HELM,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .HELM_DOCK,

        targetAnchorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createHelmFlyToTask(
    targetAnchorId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND.HELM_FLY_TO;

    return {
        kind,
        role: OFFICER_ROLE.HELM,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .HELM_FLY_TO,

        targetAnchorId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}

export function createHelmJumpTask(
    targetAnchorId: string,
    targetNodeId: string,
): OfficerTaskDraft {
    const kind =
        OFFICER_TASK_KIND.HELM_JUMP;

    return {
        kind,
        role: OFFICER_ROLE.HELM,

        sourceCommandId:
            ENCOUNTER_OFFICER_COMMAND_ID
                .HELM_JUMP,

        targetAnchorId,
        targetNodeId,

        ...getOfficerTaskDraftTuning(
            kind,
        ),
    };
}
