// src/engine/encounter/model/officer_task.ts

import type { LaserTargetZone } from '../../defs/laser';
import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import type { PointDefenseBeamBand } from '../../defs/point_defense';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    type EngineerDeployShieldCommandId,
    type WeaponsPointDefenseCommandId,
} from './command';

// Стабильный тип офицерской работы.
//
// kind отвечает на вопрос:
// «Что именно сейчас делает офицер?»
//
// Это не идентификатор конкретного запуска task.
export const OFFICER_TASK_KIND = {
    SCIENCE_PLOT_COURSE: 'science_plot_course',
    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',
    SCIENCE_PURGE_SPAM: 'science_purge_spam',
    SCIENCE_FIRE_SPAM: 'science_fire_spam',

    ENGINEER_DEPLOY_SHIELD: 'engineer_deploy_shield',
    ENGINEER_REPAIR_DRIVE: 'engineer_repair_drive',

    WEAPONS_POINT_DEFENSE: 'weapons_point_defense',

    WEAPONS_FIRE_MISSILE:
        'weapons_fire_missile',

    WEAPONS_FIRE_STICKY_MINES:
        'weapons_fire_sticky_mines',

    WEAPONS_FIRE_LASER:
        'weapons_fire_laser',

    CLEAR_STICKY_MINE: 'clear_sticky_mine',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
    HELM_JUMP: 'helm_jump',
} as const;

export type OfficerTaskKind = (typeof OFFICER_TASK_KIND)[keyof typeof OFFICER_TASK_KIND];

export type OfficerTaskCancellationPolicy = {
    // Можно ли показать игроку CANCEL TASK
    // и принять ручную отмену из bridge UI.
    canBeCancelledByPlayer: boolean;

    // Может ли damage consequence
    // принудительно прервать эту task.
    canBeInterruptedByDamage: boolean;
};

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

type EngineerDeployShieldOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;
    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: EngineerDeployShieldCommandId;

    shieldZone: LaserTargetZone;
};

type EngineerRepairDriveOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE;
    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.ENGINEER_REPAIR_DRIVE;
};

type WeaponsPointDefenseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE;
    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: WeaponsPointDefenseCommandId;

    threatId: string;
    pointDefenseBeamBand: PointDefenseBeamBand;
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

        targetZone: LaserTargetZone;
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
    | EngineerDeployShieldOfficerTaskDraft
    | EngineerRepairDriveOfficerTaskDraft
    | WeaponsPointDefenseOfficerTaskDraft
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

export function getOfficerTaskCancellationPolicy(
    kind: OfficerTaskKind,
): OfficerTaskCancellationPolicy {
    switch (kind) {
        case OFFICER_TASK_KIND.HELM_DOCK:
        case OFFICER_TASK_KIND.HELM_FLY_TO:
            return {
                canBeCancelledByPlayer: false,
                canBeInterruptedByDamage: false,
            };

        case OFFICER_TASK_KIND
            .WEAPONS_FIRE_STICKY_MINES:
            return {
                canBeCancelledByPlayer: false,
                canBeInterruptedByDamage: true,
            };

        case OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE:
        case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:
        case OFFICER_TASK_KIND.SCIENCE_PURGE_SPAM:
        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:
        case OFFICER_TASK_KIND.ENGINEER_REPAIR_DRIVE:
        case OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE:
        case OFFICER_TASK_KIND.WEAPONS_FIRE_MISSILE:
        case OFFICER_TASK_KIND.WEAPONS_FIRE_LASER:
        case OFFICER_TASK_KIND.SCIENCE_FIRE_SPAM:
        case OFFICER_TASK_KIND.CLEAR_STICKY_MINE:
        case OFFICER_TASK_KIND.HELM_JUMP:
            return {
                canBeCancelledByPlayer: true,
                canBeInterruptedByDamage: true,
            };

        default:
            return assertNever(kind);
    }
}

function assertNever(value: never): never {
    throw new Error(`Unknown officer task kind: ${value}`);
}
