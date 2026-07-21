// src/engine/encounter/objects/encounter_object.ts
import type { OfficerRole } from '../../defs/officer';
import type { EncounterOfficerCommandId } from '../model/command';
import type { NavigationBeaconEncounterObjectState } from './navigation_beacon/navigation_beacon_encounter_object';
import type { StationEncounterObjectState } from './station/station_encounter_object';

export const ENCOUNTER_OBJECT_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
} as const;

export type EncounterObjectPosition = {
    x: number;
    y: number;
};

export type EncounterObjectOfficerCommand = {
    role: OfficerRole;
    commandId: EncounterOfficerCommandId;
};

export type EncounterObjectBaseState = {
    id: string;
    displayName: string;
    position: EncounterObjectPosition;
    officerCommands: EncounterObjectOfficerCommand[];
};

export type EncounterObjectState = StationEncounterObjectState | NavigationBeaconEncounterObjectState;
