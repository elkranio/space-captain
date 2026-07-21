// src/engine/defs/universe.ts
import type { AsteroidState } from './asteroid';
import type { NavigationBeaconState } from './beacon';
import type { SpaceBackgroundId } from './space_background';
import type { StationState } from './station';
import type { Vec2, Vec3 } from './vector';

export const SPACE_OBJECT_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
    ASTEROID: 'asteroid',
} as const;

export type SpaceObjectBaseState = {
    // Позиция объекта внутри конкретной ноды.
    // x — вправо, y — вверх, z — вперёд.
    localPosition: Vec3;
};

export type StationSpaceObjectState = SpaceObjectBaseState & {
    kind: typeof SPACE_OBJECT_KIND.STATION;
    station: StationState;
};

export type NavigationBeaconSpaceObjectState = SpaceObjectBaseState & {
    kind: typeof SPACE_OBJECT_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};

export type AsteroidSpaceObjectState = SpaceObjectBaseState & {
    kind: typeof SPACE_OBJECT_KIND.ASTEROID;
    asteroid: AsteroidState;
};

export type SpaceObjectState = StationSpaceObjectState | NavigationBeaconSpaceObjectState | AsteroidSpaceObjectState;

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
