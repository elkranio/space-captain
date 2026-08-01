// src/engine/content/presets/player_ships.ts

import {
    SHIP_DRIVE_ID,
    type ShipDriveId,
} from '../../defs/ship_drive';
import {
    SHIP_WEAPON_ID,
} from '../../defs/ship_weapon';
import {
    SHIELD_GENERATOR_PRESET_ID,
    type ShieldGeneratorPresetId,
} from './shield_generators';

export const PLAYER_SHIP_PRESET_ID = {
    STARTER_00: 'starter_00',
} as const;

export type PlayerShipPresetId =
    (typeof PLAYER_SHIP_PRESET_ID)[keyof typeof PLAYER_SHIP_PRESET_ID];

export type PlayerShipLaserPreset = {
    // Runtime id установленного лазера.
    id: string;

    weaponId:
        typeof SHIP_WEAPON_ID.LASER_00;
};

export type PlayerShipPreset = {
    id: PlayerShipPresetId;

    maxHull: number;

    driveId: ShipDriveId;

    pointDefense: {
        maxCharges: number;
    };

    shieldGeneratorPresetId:
        ShieldGeneratorPresetId;

    weapons: PlayerShipLaserPreset[];
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

        shieldGeneratorPresetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        weapons: [
            {
                id: 'laser_player_00',

                weaponId:
                    SHIP_WEAPON_ID.LASER_00,
            },
        ],
    },
} satisfies Record<
    PlayerShipPresetId,
    PlayerShipPreset
>;
