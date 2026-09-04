// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import { getOfficerTaskDraftTuning } from "../../content/catalogs/officer_tasks";
import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";
import { ENCOUNTER_OFFICER_COMMAND_ID } from "../model/command";
import type { BeamCannonTargetNode, PlayerBeamTarget } from "../model/combat";
import { OFFICER_TASK_KIND, type OfficerTaskDraft } from "../model/officer_task";

export function createScientistPlotCourseTask(targetNodeId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.SCIENTIST_PLOT_COURSE;

    return {
        kind,
        role: OFFICER_ROLE.SCIENTIST,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PLOT_COURSE,

        targetNodeId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createScientistPurgeSpamTask(channelId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENTIST,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM,

        channelId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createScientistFireSpamTask(weaponId: string, targetActorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENTIST,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createEngineerRepairDriveTask(): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createEngineerDeployShieldTask(targetNode: BeamCannonTargetNode): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,

        targetNode,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createGunnerDefenseTurretTask(threatId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE,

        threatId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createGunnerFireMissileTask(weaponId: string, targetActorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createGunnerFireStickyMinesTask(weaponId: string, targetActorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createGunnerFireBeamCannonTask(
    weaponId: string, targetActorId: string, target: PlayerBeamTarget,
): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON;

    return {
        target: { ...target },
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_BEAM_CANNON,

        weaponId,
        targetActorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createClearStickyMineTask(role: OfficerRole, mineId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.CLEAR_STICKY_MINE;

    return {
        kind,
        role,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,

        mineId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createPilotDockTask(targetAnchorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_DOCK;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_DOCK,

        targetAnchorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createPilotFlyToTask(targetAnchorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_FLY_TO;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO,

        targetAnchorId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createPilotJumpTask(targetAnchorId: string, targetNodeId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_JUMP;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_JUMP,

        targetAnchorId,
        targetNodeId,

        ...getOfficerTaskDraftTuning(kind),
    };
}

export function createPilotEvadeTask(): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_EVADE;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_EVADE,

        ...getOfficerTaskDraftTuning(kind),
    };
}
