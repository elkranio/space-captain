// src/engine/defs/universe.ts
import type { SpaceBackgroundId } from './space_background';
import type { StationState } from './station';
import type { Vec2 } from './vector';

export const SPACE_OBJECT_KIND = {
    STATION: 'station',
} as const;

export type StationSpaceObjectState = {
    kind: typeof SPACE_OBJECT_KIND.STATION;
    station: StationState;
};

export type SpaceObjectState = StationSpaceObjectState;

export type SpaceNodeState = {
    id: string;

    // Позиция ноды на общей 2D-карте вселенной.
    position: Vec2;

    spaceBackgroundId: SpaceBackgroundId;
    objects: SpaceObjectState[];
};

export type UniverseState = {
    nodes: SpaceNodeState[];
};
