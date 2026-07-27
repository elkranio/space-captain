// src/engine/defs/universe.ts

import type { AsteroidState } from './asteroid';
import type { NavigationBeaconState } from './beacon';
import type { JumpPointState } from './jump_point';
import type { SpaceBackgroundId } from './space_background';
import type { StationState } from './station';
import type { Vec2, Vec3 } from './vector';
import type { ShipId } from './ship';
import type { ShipWeaponState } from './ship_weapon';

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

export const SPACE_NODE_ACTOR_KIND = {
    SHIP: 'ship',
} as const;

// Persistent actor, который уже находится внутри ноды
// до создания runtime encounter.
export type SpaceNodeActorBaseState = {
    id: string;

    // Anchor, возле которого actor находится внутри ноды.
    anchorId: string;
};

export type ShipSpaceNodeActorState = SpaceNodeActorBaseState & {
    kind: typeof SPACE_NODE_ACTOR_KIND.SHIP;

    shipId: ShipId;
    weapons: ShipWeaponState[];
};

export type SpaceNodeActorState = ShipSpaceNodeActorState;

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

    // Persistent actors, уже находящиеся внутри ноды.
    // Encounter получает их runtime-копии при загрузке.
    actors: SpaceNodeActorState[];
};

export type UniverseState = {
    nodes: SpaceNodeState[];
};
