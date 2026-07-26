// src/engine/defs/universe.ts

import type { AsteroidState } from './asteroid';
import type { NavigationBeaconState } from './beacon';
import type { JumpPointState } from './jump_point';
import type { SpaceBackgroundId } from './space_background';
import type { StationState } from './station';
import type { Vec2, Vec3 } from './vector';

export const SPACE_ANCHOR_KIND = {
    STATION: 'station',
    NAVIGATION_BEACON: 'navigation_beacon',
    ASTEROID: 'asteroid',
    JUMP_POINT: 'jump_point',
} as const;

export type SpaceAnchorBaseState = {
    // Позиция anchor внутри конкретной ноды.
    // x — вправо, y — вверх, z — вперёд.
    localPosition: Vec3;
};

export type StationSpaceAnchorState = SpaceAnchorBaseState & {
    kind: typeof SPACE_ANCHOR_KIND.STATION;
    station: StationState;
};

export type NavigationBeaconSpaceAnchorState = SpaceAnchorBaseState & {
    kind: typeof SPACE_ANCHOR_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};

export type AsteroidSpaceAnchorState = SpaceAnchorBaseState & {
    kind: typeof SPACE_ANCHOR_KIND.ASTEROID;
    asteroid: AsteroidState;
};

export type JumpPointSpaceAnchorState = SpaceAnchorBaseState & {
    kind: typeof SPACE_ANCHOR_KIND.JUMP_POINT;
    jumpPoint: JumpPointState;
};

export type SpaceAnchorState =
    | StationSpaceAnchorState
    | NavigationBeaconSpaceAnchorState
    | AsteroidSpaceAnchorState
    | JumpPointSpaceAnchorState;

export type SpaceNodeState = {
    id: string;

    // Позиция ноды на общей 2D-карте вселенной.
    position: Vec2;

    // Anchor, рядом с которым корабль появляется после прыжка.
    arrivalAnchorId: string;

    spaceBackgroundId: SpaceBackgroundId;
    anchors: SpaceAnchorState[];
};

export type UniverseState = {
    nodes: SpaceNodeState[];
};
