// src/engine/encounter/objects/encounter_object.ts
import type { OfficerRole } from '../../defs/officer';
import type { EncounterOfficerCommandId } from '../model/command';
import type { AsteroidEncounterObjectState } from './asteroid/asteroid_encounter_object';
import type { NavigationBeaconEncounterObjectState } from './navigation_beacon/navigation_beacon_encounter_object';
import type { StationEncounterObjectState } from './station/station_encounter_object';

export const ENCOUNTER_OBJECT_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
    ASTEROID: 'asteroid',
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

    // Пока переходная нормализованная позиция на viewscreen.
    // Позже будет вычисляться из localPosition и состояния корабля.
    position: EncounterObjectPosition;

    officerCommands: EncounterObjectOfficerCommand[];
};

export type EncounterObjectState =
    | StationEncounterObjectState
    | NavigationBeaconEncounterObjectState
    | AsteroidEncounterObjectState;
