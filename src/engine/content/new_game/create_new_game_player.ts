// src/engine/content/new_game/create_new_game_player.ts

import type { PlayerState } from "../../defs/player";
import type { PlayerLocationState } from "../../defs/player_location";
import { createDebugStartPlayerShip } from "./debug_start_ship_factory";

export function createNewGamePlayer(location: PlayerLocationState): PlayerState {
    return {
        ship: createDebugStartPlayerShip(),

        location,
    };
}
