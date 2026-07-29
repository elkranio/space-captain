// src/engine/content/presets/player_ships.ts

export const PLAYER_SHIP_PRESET_ID = {
    STARTER_00: 'starter_00',
} as const;

export type PlayerShipPresetId = (typeof PLAYER_SHIP_PRESET_ID)[keyof typeof PLAYER_SHIP_PRESET_ID];

export type PlayerShipPreset = {
    id: PlayerShipPresetId;

    maxHull: number;

    pointDefense: {
        maxCharges: number;
    };
};

export const PLAYER_SHIP_PRESETS = {
    [PLAYER_SHIP_PRESET_ID.STARTER_00]: {
        id: PLAYER_SHIP_PRESET_ID.STARTER_00,

        maxHull: 3,

        pointDefense: {
            maxCharges: 4,
        },
    },
} satisfies Record<PlayerShipPresetId, PlayerShipPreset>;
