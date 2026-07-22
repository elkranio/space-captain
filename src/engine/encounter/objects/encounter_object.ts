// src/engine/encounter/objects/encounter_object.ts

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

export type EncounterObjectBaseState = {
    id: string;
    displayName: string;

    // Пока переходная нормализованная позиция на viewscreen.
    // Позже будет вычисляться из localPosition и состояния корабля.
    position: EncounterObjectPosition;

    // Encounter object определяет только поддерживаемые command ids.
    //
    // Role, label, targeting и прочие статические свойства
    // берутся из соответствующего command def.
    officerCommandIds: EncounterOfficerCommandId[];
};

export type EncounterObjectState =
    | StationEncounterObjectState
    | NavigationBeaconEncounterObjectState
    | AsteroidEncounterObjectState;
