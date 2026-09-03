import type { PlayerSpaceNavigationState } from "../../defs/player_location";
import type { EncounterState } from "../model/state";
import {
    getEnemyShipDashboardSnapshots,
    type EnemyShipDashboardSnapshot,
} from "../combat/queries/get_enemy_ship_dashboard_snapshots";
import { createCombatPresentationSnapshot, type CombatPresentationSnapshot } from "./combat_presentation_snapshot";
import {
    createEncounterSpacePresentationSnapshot,
    type EncounterSpacePresentationSnapshot,
} from "./encounter_space_presentation_snapshot";

// Safe app-facing read model for one encounter frame.
//
// This is the aggregation root for continuously changing presentation data.
// Mutable truth remains in EncounterState. The snapshot contains only
// presentation-safe projections and is detached by EncounterSnapshotReader.
//
// Keep focused builders/queries specialized; this type only owns composition.
export type EncounterPresentationSnapshot = CombatPresentationSnapshot & {
    navigation: PlayerSpaceNavigationState;

    space: EncounterSpacePresentationSnapshot;

    enemyShipDashboards: EnemyShipDashboardSnapshot[];
};

export function createEncounterPresentationSnapshot(state: EncounterState): EncounterPresentationSnapshot {
    return {
        navigation: state.navigation,

        space: createEncounterSpacePresentationSnapshot(state),

        enemyShipDashboards: getEnemyShipDashboardSnapshots(state),

        ...createCombatPresentationSnapshot(state),
    };
}
