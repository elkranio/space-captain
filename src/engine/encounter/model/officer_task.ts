// src/engine/encounter/model/officer_task.ts

import { OFFICER_ROLE, type OfficerRole } from '../../defs/officer';
import type { PointDefenseBeamBand } from '../../defs/point_defense';
import { ENCOUNTER_OFFICER_COMMAND_ID, type WeaponsPointDefenseCommandId } from './command';

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

    WEAPONS_POINT_DEFENSE: 'weapons_point_defense',

    HELM_DOCK: 'helm_dock',
    HELM_FLY_TO: 'helm_fly_to',
    HELM_JUMP: 'helm_jump',
} as const;

export type OfficerTaskKind = (typeof OFFICER_TASK_KIND)[keyof typeof OFFICER_TASK_KIND];

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

    targetId: string;
};

type CommsRequestDockingOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.COMMS_REQUEST_DOCKING;
    role: typeof OFFICER_ROLE.COMMS;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.COMMS_REQUEST_DOCKING;

    targetId: string;
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

    targetId: string;
};

type WeaponsPointDefenseOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.WEAPONS_POINT_DEFENSE;
    role: typeof OFFICER_ROLE.WEAPONS;

    sourceCommandId: WeaponsPointDefenseCommandId;

    targetId: string;
    pointDefenseBeamBand: PointDefenseBeamBand;
};

type HelmDockOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_DOCK;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_DOCK;

    targetId: string;
};

type HelmFlyToOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_FLY_TO;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_FLY_TO;

    targetId: string;
};

type HelmJumpOfficerTaskDraft = OfficerTaskDraftBase & {
    kind: typeof OFFICER_TASK_KIND.HELM_JUMP;
    role: typeof OFFICER_ROLE.HELM;

    sourceCommandId: typeof ENCOUNTER_OFFICER_COMMAND_ID.HELM_JUMP;

    targetId: string;
    targetNodeId: string;
};

// Описание task до её запуска.
//
// Factory определяет содержание работы,
// но не создаёт runtime identity или progress.
//
// Task-specific поля принадлежат только тем
// вариантам task, которым они действительно нужны.
export type OfficerTaskDraft =
    | CommsHailOfficerTaskDraft
    | CommsRequestDockingOfficerTaskDraft
    | SciencePlotCourseOfficerTaskDraft
    | ScienceIdentifyThreatOfficerTaskDraft
    | WeaponsPointDefenseOfficerTaskDraft
    | HelmDockOfficerTaskDraft
    | HelmFlyToOfficerTaskDraft
    | HelmJumpOfficerTaskDraft;

// Активная runtime task.
//
// id и начальный progress назначает OfficerTaskRunner
// в момент запуска конкретного экземпляра.
export type OfficerTaskState = OfficerTaskDraft & {
    id: string;

    elapsedMs: number;
};

export type OfficerTaskStates = Partial<Record<OfficerRole, OfficerTaskState>>;
