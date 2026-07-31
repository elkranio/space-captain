// src/engine/content/presets/player_ships.ts

import {
    SHIP_DRIVE_ID,
    type ShipDriveId,
} from '../../defs/ship_drive';

export const PLAYER_SHIP_PRESET_ID = {
    STARTER_00: 'starter_00',
} as const;

export type PlayerShipPresetId = (typeof PLAYER_SHIP_PRESET_ID)[keyof typeof PLAYER_SHIP_PRESET_ID];

export type PlayerShipPreset = {
    id: PlayerShipPresetId;

    maxHull: number;

    driveId: ShipDriveId;

    pointDefense: {
        maxCharges: number;
    };

    shieldGenerator: {
        maxCharges: number;
        chargeRegenerationDurationMs: number;
    };
};

export const PLAYER_SHIP_PRESETS = {
    [PLAYER_SHIP_PRESET_ID.STARTER_00]: {
        id: PLAYER_SHIP_PRESET_ID.STARTER_00,

        maxHull: 3,

        driveId:
            SHIP_DRIVE_ID.BASIC_00,

        pointDefense: {
            maxCharges: 4,
        },

        shieldGenerator: {
            maxCharges: 3,
            chargeRegenerationDurationMs: 20000,
        },
    },
} satisfies Record<PlayerShipPresetId, PlayerShipPreset>;
