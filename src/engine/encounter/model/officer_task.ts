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
    COMMS_HAIL: 'comms_hail',
    COMMS_REQUEST_DOCKING: 'comms_request_docking',

    SCIENCE_PLOT_COURSE: 'science_plot_course',
    SCIENCE_IDENTIFY_THREAT: 'science_identify_threat',

    ENGINEER_DEPLOY_SHIELD: 'engineer_deploy_shield',

    WEAPONS_POINT_DEFENSE: 'weapons_point_defense',

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

type CommsHailOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.COMMS_HAIL;
    role: typeof OFFICER_ROLE.COMMS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.COMMS_HAIL;

    targetAnchorId: string;
};

type CommsRequestDockingOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING;
    role: typeof OFFICER_ROLE.COMMS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING;

    targetAnchorId: string;
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

type EngineerDeployShieldOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD;
    role: typeof OFFICER_ROLE.ENGINEER;

    sourceCommandId: EngineerDeployShieldCommandId;

    shieldZone: LaserTargetZone;
};

type WeaponsPointDefenseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE;
    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: WeaponsPointDefenseCommandId;

    threatId: string;
    pointDefenseBeamBand: PointDefenseBeamBand;
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
    | CommsHailOfficerTaskDraft
    | CommsRequestDockingOfficerTaskDraft
    | SciencePlotCourseOfficerTaskDraft
    | ScienceIdentifyThreatOfficerTaskDraft
    | EngineerDeployShieldOfficerTaskDraft
    | WeaponsPointDefenseOfficerTaskDraft
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

        case OFFICER_TASK_KIND.COMMS_HAIL:
        case OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING:
        case OFFICER_TASK_KIND.SCIENCE_PLOT_COURSE:
        case OFFICER_TASK_KIND.SCIENCE_IDENTIFY_THREAT:
        case OFFICER_TASK_KIND.ENGINEER_DEPLOY_SHIELD:
        case OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE:
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
