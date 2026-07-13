// src\engine\encounter\objects\encounter_object.ts

import type { OfficerRole } from '../../defs/officer';
import type { EncounterOfficerCommandId } from '../encounter_command';
import type { StationEncounterObjectState } from './station/station_encounter_object';

export const ENCOUNTER_OBJECT_KIND = {
    STATION: 'station',
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

export type EncounterObjectState = StationEncounterObjectState;
