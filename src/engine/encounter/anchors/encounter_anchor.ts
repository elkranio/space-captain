// src/engine/encounter/anchors/encounter_anchor.ts

import type { AsteroidState } from "../../defs/asteroid";
import type { NavigationBeaconState } from "../../defs/beacon";
import type { JumpPointState } from "../../defs/jump_point";
import type { StationState } from "../../defs/station";
import type { Vec3 } from "../../defs/vector";

export const ENCOUNTER_ANCHOR_KIND = {
    STATION: "station",
    NAVIGATION_BEACON: "navigation_beacon",
    ASTEROID: "asteroid",
    JUMP_POINT: "jump_point",
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

export type StationEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.STATION;
    station: StationState;
};

export type NavigationBeaconEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};

export type AsteroidEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.ASTEROID;
    asteroid: AsteroidState;
};

export type JumpPointEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
    jumpPoint: JumpPointState;
};

export type EncounterAnchorState =
    | StationEncounterAnchorState
    | NavigationBeaconEncounterAnchorState
    | AsteroidEncounterAnchorState
    | JumpPointEncounterAnchorState;
