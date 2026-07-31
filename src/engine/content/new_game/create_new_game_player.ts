// src/engine/content/new_game/create_new_game_player.ts

import type {
    PlayerState,
    PlayerShipState,
} from '../../defs/player';
import type { PlayerLocationState } from '../../defs/player_location';
import { SHIP_DRIVE_STATUS } from '../../defs/ship_drive';
import { SHIP_DRIVES } from '../catalogs/ship_drives';
import {
    PLAYER_SHIP_PRESETS,
    type PlayerShipPresetId,
} from '../presets/player_ships';

const NEW_GAME_PLAYER_SHIP_SYSTEM_ID = {
    DRIVE: 'drive_player_00',
} as const;

export function createNewGamePlayer(
    location: PlayerLocationState,
    shipPresetId: PlayerShipPresetId,
): PlayerState {
    return {
        ship: createPlayerShip(shipPresetId),
        location,
    };
}

function createPlayerShip(
    presetId: PlayerShipPresetId,
): PlayerShipState {
    const preset = PLAYER_SHIP_PRESETS[presetId];
    const drive = SHIP_DRIVES[preset.driveId];

    return {
        hull: preset.maxHull,
        maxHull: preset.maxHull,

        drive: {
            id:
                NEW_GAME_PLAYER_SHIP_SYSTEM_ID.DRIVE,

            driveId: drive.id,
            status:
                SHIP_DRIVE_STATUS.ONLINE,
        },

        pointDefense: {
            charges: preset.pointDefense.maxCharges,
            maxCharges: preset.pointDefense.maxCharges,
        },

        shieldGenerator: {
            charges: preset.shieldGenerator.maxCharges,
            maxCharges: preset.shieldGenerator.maxCharges,

            chargeRegenerationDurationMs:
                preset.shieldGenerator
                    .chargeRegenerationDurationMs,

            chargeRegenerationElapsedMs: 0,
        },

        weapons: [],
    };
}
