// src/engine/content/new_game/create_new_game_player.ts

import type { PlayerState, PlayerShipState } from '../../defs/player';
import type { PlayerLocationState } from '../../defs/player_location';
import { PLAYER_SHIP_PRESETS, PLAYER_SHIP_PRESET_ID, type PlayerShipPresetId } from '../presets/player_ships';

const NEW_GAME_PLAYER_SHIP_PRESET_ID = PLAYER_SHIP_PRESET_ID.STARTER_00;

export function createNewGamePlayer(location: PlayerLocationState): PlayerState {
    return {
        ship: createPlayerShip(NEW_GAME_PLAYER_SHIP_PRESET_ID),
        location,
    };
}

function createPlayerShip(presetId: PlayerShipPresetId): PlayerShipState {
    const preset = PLAYER_SHIP_PRESETS[presetId];

    return {
        hull: preset.maxHull,
        maxHull: preset.maxHull,

        pointDefense: {
            charges: preset.pointDefense.maxCharges,
            maxCharges: preset.pointDefense.maxCharges,
        },

        shieldGenerator: {
            charges: preset.shieldGenerator.maxCharges,
            maxCharges: preset.shieldGenerator.maxCharges,
        },

        weapons: [],
    };
}
