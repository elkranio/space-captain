// src/engine/encounter/model/officer_task.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskCancellationPolicy,
} from '../../defs/officer_task';
export {
    OFFICER_TASK_KIND,
    type OfficerTaskCancellationPolicy,
    type OfficerTaskKind,
} from '../../defs/officer_task';
import type { DefenseTurretSignature } from '../../defs/defense_turret';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type WeaponsDefenseTurretCommandId,
} from './command';

type OfficerTaskDraftBase = {
    label: string;

    // Нужно ли presentation-слою показывать
    // игроку точный прогресс этой task.
    showProgress: boolean;

    durationMs: number | null;
};

type SciencePlotCourseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE;
    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PLOT_COURSE;

    targetNodeId: string;
};

type ScienceIdentifyThreatOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT;
    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_IDENTIFY_THREAT;

    threatId: string;
};

type SciencePurgeSpamOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM;
    role: typeof OFFICER_ROLE.SCIENCE;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.SCIENCE_PURGE_SPAM;

    channelId: string;
};


type EngineerRepairDriveOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE;
    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE;
};

type EngineerDeployShieldOfficerTaskDraft = OfficerTaskDraftBase & {
    kind:
        typeof OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;

    role:
        typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId:
        typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_DEPLOY_SHIELD;
};

type WeaponsDefenseTurretOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_DEFENSE_TURRET;
    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: WeaponsDefenseTurretCommandId;

    threatId: string;
    defenseTurretSignature: DefenseTurretSignature;
};

type WeaponsFireMissileOfficerTaskDraft =
    OfficerTaskDraftBase & {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_MISSILE;

        role:
            typeof OFFICER_ROLE.WEAPONS;

        sourceCommandId:
            typeof ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_MISSILE;

        weaponId: string;
        targetActorId: string;
    };

type WeaponsFireStickyMinesOfficerTaskDraft =
    OfficerTaskDraftBase & {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_STICKY_MINES;

        role:
            typeof OFFICER_ROLE.WEAPONS;

        sourceCommandId:
            typeof ENCOUNTER_OFFICER_COMMAND_ID
                .WEAPONS_FIRE_STICKY_MINES;

        weaponId: string;
        targetActorId: string;
    };

type WeaponsFireLaserOfficerTaskDraft =
    OfficerTaskDraftBase & {
        kind:
            typeof OFFICER_TASK_KIND.WEAPONS_FIRE_LASER;

        role:
            typeof OFFICER_ROLE.WEAPONS;

        sourceCommandId:
            typeof ENCOUNTER_OFFICER_COMMAND_ID.WEAPONS_FIRE_LASER;

        weaponId: string;
        targetActorId: string;
    };

type ScienceFireSpamOfficerTaskDraft =
    OfficerTaskDraftBase & {
        kind:
            typeof OFFICER_TASK_KIND
                .SCIENCE_FIRE_SPAM;

        role:
            typeof OFFICER_ROLE.SCIENCE;

        sourceCommandId:
            typeof ENCOUNTER_OFFICER_COMMAND_ID
                .SCIENCE_FIRE_SPAM;

        weaponId: string;
        targetActorId: string;
    };

type ClearStickyMineOfficerTaskDraft = OfficerTaskDraftBase & {
    kind:
        typeof OFFICER_TASK_KIND.CLEAR_STICKY_MINE;
    role: OfficerRole;

    sourceCommandId:
        typeof ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE;

    mineId: string;
};

type HelmDockOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_DOCK;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK;

    targetAnchorId: string;
};

type HelmFlyToOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_FLY_TO;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO;

    targetAnchorId: string;
};

type HelmJumpOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_JUMP;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP;

    targetAnchorId: string;
    targetNodeId: string;
};

// Описание task до её запуска.
//
// Factory определяет содержание работы,
// но не создаёт runtime identity, progress
// или cancellation policy.
//
// Task-specific поля принадлежат только тем
// вариантам task, которым они действительно нужны.
export type OfficerTaskDraft =
    | SciencePlotCourseOfficerTaskDraft
    | ScienceIdentifyThreatOfficerTaskDraft
    | SciencePurgeSpamOfficerTaskDraft
    | EngineerRepairDriveOfficerTaskDraft
    | EngineerDeployShieldOfficerTaskDraft
    | WeaponsDefenseTurretOfficerTaskDraft
    | WeaponsFireMissileOfficerTaskDraft
    | WeaponsFireStickyMinesOfficerTaskDraft
    | WeaponsFireLaserOfficerTaskDraft
    | ScienceFireSpamOfficerTaskDraft
    | ClearStickyMineOfficerTaskDraft
    | HelmDockOfficerTaskDraft
    | HelmFlyToOfficerTaskDraft
    | HelmJumpOfficerTaskDraft;

// Активная runtime task.
//
// id, начальный progress и cancellation policy
// назначает OfficerTaskRunner при запуске.
export type OfficerTaskState = OfficerTaskDraft &
    OfficerTaskCancellationPolicy & {
        id: string;

        elapsedMs: number;
    };

export type OfficerTaskStates = Partial<Record<OfficerRole, OfficerTaskState>>;
