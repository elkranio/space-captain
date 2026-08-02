// src/engine/encounter/commands/queries/find_current_enemy_ship.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../../defs/player_location';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import type {
    EncounterState,
} from '../../model/state';

export function findCurrentEnemyShip(
    state: EncounterState,
): ShipEncounterActorState | undefined {
    const navigation = state.navigation;

    if (
        navigation.kind !==
        PLAYER_SPACE_NAVIGATION_KIND
            .ANCHORED
    ) {
        return undefined;
    }

    return state.actors.find((actor) => {
        return (
            actor.team ===
                ENCOUNTER_TEAM.ENEMY &&
            actor.hull > 0 &&
            actor.anchorId ===
                navigation.anchorId
        );
    });
}
