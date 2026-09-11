// src/engine/encounter/officer_tasks/create_officer_task_draft.ts

import { CREW_ACTIONS } from "../../content/catalogs/crew_actions";
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

        label: "PLOT COURSE",
        durationMs: CREW_ACTIONS.scientist_plot_course.durationMs,
    };
}

export function createScientistPurgeSpamTask(channelId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.SCIENTIST_PURGE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENTIST,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_PURGE_SPAM,

        channelId,

        label: "PURGE SPAM",
        durationMs: CREW_ACTIONS.scientist_purge_spam.durationMs,
    };
}

export function createScientistFireSpamTask(
    weaponId: string,
    targetActorId: string,
    warmupDurationMs: number,
): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.SCIENTIST_FIRE_SPAM;

    return {
        kind,
        role: OFFICER_ROLE.SCIENTIST,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.SCIENTIST_FIRE_SPAM,

        weaponId,
        targetActorId,

        label: "SPAM WARM-UP",
        durationMs: warmupDurationMs,
    };
}

export function createEngineerRepairDriveTask(durationMs: number): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE,

        label: "REPAIR ENGINE",
        durationMs,
    };
}

export function createEngineerDeployShieldTask(targetNode: BeamCannonTargetNode, durationMs: number): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;

    return {
        kind,
        role: OFFICER_ROLE.ENGINEER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD,

        targetNode,

        label: "DEPLOY SHIELD",
        durationMs,
    };
}

export function createGunnerDefenseTurretTask(threatId: string, durationMs: number): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_DEFENSE_TURRET;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_INTERCEPT_MISSILE,

        threatId,

        label: "TURRET AIM",
        durationMs,
    };
}

export function createGunnerFireMissileTask(
    weaponId: string, targetActorId: string, durationMs: number,
): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_FIRE_MISSILE;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_MISSILE,

        weaponId,
        targetActorId,

        label: "MISSILE AIM",
        durationMs,
    };
}

export function createGunnerFireStickyMinesTask(
    weaponId: string, targetActorId: string, durationMs: number,
): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.GUNNER_FIRE_STICKY_MINES;

    return {
        kind,
        role: OFFICER_ROLE.GUNNER,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.GUNNER_FIRE_STICKY_MINES,

        weaponId,
        targetActorId,

        label: "MINE AIM",
        durationMs,
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

        label: "BEAM CANNON CHARGE",
        durationMs: null,
    };
}

export function createClearStickyMineTask(role: OfficerRole, mineId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.CLEAR_STICKY_MINE;

    return {
        kind,
        role,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,

        mineId,

        label: "CLEAR MINE",
        durationMs: CREW_ACTIONS.clear_sticky_mine.durationMs,
    };
}

export function createPilotDockTask(targetAnchorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_DOCK;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_DOCK,

        targetAnchorId,

        label: "FLY TO",
        durationMs: null,
    };
}

export function createPilotFlyToTask(targetAnchorId: string): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_FLY_TO;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_FLY_TO,

        targetAnchorId,

        label: "FLY TO",
        durationMs: null,
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

        label: "JUMP",
        durationMs: null,
    };
}

export function createPilotEvadeTask(): OfficerTaskDraft {
    const kind = OFFICER_TASK_KIND.PILOT_EVADE;

    return {
        kind,
        role: OFFICER_ROLE.PILOT,

        sourceCommandId: ENCOUNTER_OFFICER_COMMAND_ID.PILOT_EVADE,

        label: "EVADE",
        durationMs: null,
    };
}
