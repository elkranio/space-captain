// src/engine/encounter/model/officer_task.ts
import type { OfficerRole } from '../../defs/officer';
import type { EncounterOfficerCommandId } from './command';

export const OFFICER_TASK_ID = {
    COMMS_HAIL: 'comms_hail',
    COMMS_REQUEST_DOCKING: 'comms_request_docking',
    HELM_DOCK: 'helm_dock',
} as const;

export type OfficerTaskId = (typeof OFFICER_TASK_ID)[keyof typeof OFFICER_TASK_ID];

export type OfficerTaskState = {
    id: OfficerTaskId;
    role: OfficerRole;
    sourceCommandId: EncounterOfficerCommandId;
    targetId?: string;
    label: string;
    elapsedMs: number;
    durationMs: number | null;
};

export type OfficerTaskStates = Partial<Record<OfficerRole, OfficerTaskState>>;
