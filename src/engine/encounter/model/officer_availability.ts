// src/engine/encounter/model/officer_availability.ts

import type { OfficerRole } from "../../defs/officer";

export const OFFICER_AVAILABILITY_STATE = {
    UNAVAILABLE: "unavailable",
    AVAILABLE: "available",
    BUSY: "busy",
    BLOCKED: "blocked",
} as const;

export type OfficerAvailabilityState = (typeof OFFICER_AVAILABILITY_STATE)[keyof typeof OFFICER_AVAILABILITY_STATE];

export type OfficerAvailabilityStates = Record<OfficerRole, OfficerAvailabilityState>;
