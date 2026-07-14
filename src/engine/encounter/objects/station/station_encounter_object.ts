// src/engine/encounter/objects/station/station_encounter_object.ts
import type { StationState } from '../../../defs/station';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectBaseState } from '../encounter_object';

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

export type StationEncounterObjectState = EncounterObjectBaseState & {
    kind: typeof ENCOUNTER_OBJECT_KIND.STATION;
    station: StationState;
    docking: StationDockingState;
};
