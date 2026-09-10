// src/engine/generation/new_game/create_new_run_state.ts

import type { RunState } from "../../defs/run";
import { createDebugStartPlayerShip } from "./debug_start_ship_factory";
import { createNewGameOfficers, NEW_GAME_CONFIG } from "./new_game_config";
import NewGameUniverseFactory from "./NewGameUniverseFactory";

export function createNewRunState(): RunState {
    const world = NewGameUniverseFactory.create();

    const playerLocation = world.playerLocations[NEW_GAME_CONFIG.player.locationId];

    return {
        universe: world.universe,

        player: {
            ship: createDebugStartPlayerShip(),
            location: playerLocation,
        },

        officers: createNewGameOfficers(),
    };
}
