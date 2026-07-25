// src/engine/encounter/objects/encounter_object.ts

import type { Vec3 } from '../../defs/vector';
import type { AsteroidEncounterObjectState } from './asteroid/asteroid_encounter_object';
import type { JumpPointEncounterObjectState } from './jump_point/jump_point_encounter_object';
import type { NavigationBeaconEncounterObjectState } from './navigation_beacon/navigation_beacon_encounter_object';
import type { StationEncounterObjectState } from './station/station_encounter_object';

export const ENCOUNTER_OBJECT_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
    ASTEROID: 'asteroid',
    JUMP_POINT: 'jump_point',
} as const;

export type EncounterObjectPosition = {
    x: number;
    y: number;
};

export type EncounterObjectBaseState = {
    id: string;
    displayName: string;

    // Navigation object, вокруг которого объект
    // находится внутри текущего anchor.
    //
    // Пока каждый encounter object является
    // собственным navigation object.
    anchorObjectId: string;

    // Позиция объекта внутри space node.
    //
    // Для navigation object это позиция anchor.
    // Для будущих actors может быть локальная
    // пространственная позиция рядом с anchor.
    localPosition: Vec3;

    // Каноническая нормализованная позиция объекта
    // в финальной композиции bridge viewscreen.
    position: EncounterObjectPosition;

    // Коэффициент фальшивой перспективы.
    //
    // 1 — базовая глубина;
    // меньше 1 — объект визуально дальше;
    // больше 1 — объект визуально ближе.
    perspectiveDepth: number;
};

export type EncounterObjectState =
    | StationEncounterObjectState
    | NavigationBeaconEncounterObjectState
    | AsteroidEncounterObjectState
    | JumpPointEncounterObjectState;
