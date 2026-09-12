// src/engine/encounter/model/officer_status.ts

import type { OfficerRole } from "../../defs/officer";

export const OFFICER_STATUS_KIND = {
    NEURAL_RECOVERY: "neural_recovery",
} as const;

export type OfficerStatusKind = (typeof OFFICER_STATUS_KIND)[keyof typeof OFFICER_STATUS_KIND];

export type OfficerStatusState = {
    kind: OfficerStatusKind;
    role: OfficerRole;

    durationMs: number;
    elapsedMs: number;
};

export type OfficerStatusStates = Partial<Record<OfficerRole, OfficerStatusState>>;
