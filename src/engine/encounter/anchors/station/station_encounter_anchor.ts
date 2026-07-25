// src/engine/encounter/anchors/station/station_encounter_anchor.ts

import type { StationState } from '../../../defs/station';
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorBaseState } from '../encounter_anchor';

export const DOCKING_CLEARANCE_STATE = {
    NONE: 'none',
    REQUESTED: 'requested',
    GRANTED: 'granted',
    DENIED: 'denied',
} as const;

export type DockingClearanceState = (typeof DOCKING_CLEARANCE_STATE)[keyof typeof DOCKING_CLEARANCE_STATE];

export type StationDockingState = {
    clearance: DockingClearanceState;
};

export type StationEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.STATION;
    station: StationState;
    docking: StationDockingState;
};
