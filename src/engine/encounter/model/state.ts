// src/engine/encounter/model/state.ts

import type { PlayerHullState } from "../../defs/player";
import type { PlayerSpaceNavigationState } from "../../defs/player_location";
import type { SpaceBackgroundId } from "../../defs/space_background";
import type { ShipEvadeState } from "../../defs/ship_evade";
import type { EncounterActorState } from "../actors/encounter_actor";
import type { EncounterAnchorState } from "../anchors/encounter_anchor";
import type { OfficerTaskStates } from "./officer_task";
import type { EncounterCombatState } from "./combat";
import type { EncounterShipDriveState } from "./equipment";

export type { EncounterShipDriveState } from "./equipment";

// Полный runtime snapshot текущего encounter.
// Здесь хранится только доменное состояние, без Phaser/UI объектов.
export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;

    playerHull: PlayerHullState;

    navigation: PlayerSpaceNavigationState;

    drive: EncounterShipDriveState;

    // Transient maneuver state belongs to the encounter,
    // not to the persistent installed drive snapshot.
    evade: ShipEvadeState;

    combat: EncounterCombatState;

    // Пространственные точки текущего encounter:
    // station, beacon, asteroid, jump point.
    anchors: EncounterAnchorState[];

    // Эфемерные участники encounter,
    // находящиеся возле anchors.
    actors: EncounterActorState[];

    officerTasks: OfficerTaskStates;
};
