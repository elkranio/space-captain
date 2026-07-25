// src/engine/encounter/anchors/encounter_anchor.ts

import type { Vec3 } from '../../defs/vector';
import type { AsteroidEncounterAnchorState } from './asteroid/asteroid_encounter_anchor';
import type { JumpPointEncounterAnchorState } from './jump_point/jump_point_encounter_anchor';
import type { NavigationBeaconEncounterAnchorState } from './navigation_beacon/navigation_beacon_encounter_anchor';
import type { StationEncounterAnchorState } from './station/station_encounter_anchor';

export const ENCOUNTER_ANCHOR_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
    ASTEROID: 'asteroid',
    JUMP_POINT: 'jump_point',
} as const;

export type EncounterAnchorPosition = {
    x: number;
    y: number;
};

export type EncounterAnchorBaseState = {
    id: string;
    displayName: string;

    // Позиция anchor внутри space node.
    localPosition: Vec3;

    // Каноническая нормализованная позиция
    // в финальной композиции bridge viewscreen.
    position: EncounterAnchorPosition;

    // Коэффициент фальшивой перспективы.
    //
    // 1 — базовая глубина;
    // меньше 1 — anchor визуально дальше;
    // больше 1 — anchor визуально ближе.
    perspectiveDepth: number;
};

export type EncounterAnchorState =
    | StationEncounterAnchorState
    | NavigationBeaconEncounterAnchorState
    | AsteroidEncounterAnchorState
    | JumpPointEncounterAnchorState;
