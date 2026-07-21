// src/engine/defs/universe.ts
import type { NavigationBeaconState } from './beacon';
import type { SpaceBackgroundId } from './space_background';
import type { StationState } from './station';
import type { Vec2 } from './vector';

export const SPACE_OBJECT_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
} as const;

export type StationSpaceObjectState = {
    kind: typeof SPACE_OBJECT_KIND.STATION;
    station: StationState;
};

export type NavigationBeaconSpaceObjectState = {
    kind: typeof SPACE_OBJECT_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};

export type SpaceObjectState = StationSpaceObjectState | NavigationBeaconSpaceObjectState;

export type SpaceNodeState = {
    id: string;

    // Позиция ноды на общей 2D-карте вселенной.
    position: Vec2;

    // Объект, рядом с которым корабль появляется после прыжка.
    arrivalObjectId: string;

    spaceBackgroundId: SpaceBackgroundId;
    objects: SpaceObjectState[];
};

export type UniverseState = {
    nodes: SpaceNodeState[];
};
