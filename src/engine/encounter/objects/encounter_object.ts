// src\engine\encounter\objects\encounter_object.ts

import type { EncounterOfficerCommandId } from '../encounter_command';
import type { StationEncounterObjectState } from './station/station_encounter_object';

export const ENCOUNTER_OBJECT_KIND = {
    STATION: 'station',
} as const;

export type EncounterObjectPosition = {
    x: number;
    y: number;
};

export type EncounterObjectBaseState = {
    id: string;
    position: EncounterObjectPosition;
    supportedCommandIds: EncounterOfficerCommandId[];
};

export type EncounterObjectState = StationEncounterObjectState;
