// src/engine/encounter/model/officer_task.ts

import type { OfficerRole } from '../../defs/officer';
import type { EncounterOfficerCommandId } from './command';

// Стабильный тип офицерской работы.
//
// kind отвечает на вопрос:
// «Что именно сейчас делает офицер?»
//
// Это не идентификатор конкретного запуска task.
export const OFFICER_TASK_KIND = {
    COMMS_HAIL: 'comms_hail',

    COMMS_REQUEST_DOCKING: 'comms_request_docking',

    HELM_DOCK: 'helm_dock',

    HELM_FLY_TO: 'helm_fly_to',
} as const;

export type OfficerTaskKind = (typeof OFFICER_TASK_KIND)[keyof typeof OFFICER_TASK_KIND];

export type OfficerTaskState = {
    // Уникальный runtime ID конкретного запуска:
    // task_1, task_2, task_3...
    id: string;

    // Стабильный тип выполняемой работы:
    // comms_hail, helm_fly_to...
    kind: OfficerTaskKind;

    role: OfficerRole;

    sourceCommandId: EncounterOfficerCommandId;

    targetId?: string;

    label: string;

    elapsedMs: number;

    durationMs: number | null;
};

export type OfficerTaskStates = Partial<Record<OfficerRole, OfficerTaskState>>;
