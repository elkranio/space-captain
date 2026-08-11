// src/engine/content/presets/player_ships.ts

import { MISSILE_LAUNCHER_PRESET_ID, type MissileLauncherPresetId } from './missile_launchers';
import {
    STICKY_MINE_DISPENSER_PRESET_ID,
    type StickyMineDispenserPresetId,
} from './sticky_mine_dispensers';
import {
    DEFENSE_CAPACITOR_ID,
    type DefenseCapacitorId,
} from '../../defs/defense_capacitor';
import {
    POINT_DEFENSE_ID,
    type PointDefenseId,
} from '../../defs/point_defense';
import { SHIP_DRIVE_ID, type ShipDriveId } from '../../defs/ship_drive';
import { SHIP_WEAPON_ID } from '../../defs/ship_weapon';

export const PLAYER_SHIP_PRESET_ID = {
    STARTER_00: 'starter_00',
} as const;

export type PlayerShipPresetId = (typeof PLAYER_SHIP_PRESET_ID)[keyof typeof PLAYER_SHIP_PRESET_ID];

export type PlayerShipLaserPreset = {
    // Runtime id установленного лазера.
    id: string;

    weaponId: typeof SHIP_WEAPON_ID.LASER_00;
};

export type PlayerShipMissileLauncherPreset = {
    // Runtime id установленной ракетницы.
    id: string;

    weaponId: typeof SHIP_WEAPON_ID.MISSILE_LAUNCHER_00;

    presetId: MissileLauncherPresetId;
};

export type PlayerShipStickyMineDispenserPreset = {
    // Runtime id установленного dispenser.
    id: string;

    weaponId:
        typeof SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00;

    presetId:
        StickyMineDispenserPresetId;
};

export type PlayerShipSpamProjectorPreset = {
    // Runtime id установленного spam projector.
    id: string;

    weaponId:
        typeof SHIP_WEAPON_ID
            .SPAM_PROJECTOR_00;
};

export type PlayerShipWeaponPreset =
    | PlayerShipLaserPreset
    | PlayerShipMissileLauncherPreset
    | PlayerShipStickyMineDispenserPreset
    | PlayerShipSpamProjectorPreset;

export type PlayerShipPreset = {
    id: PlayerShipPresetId;

    maxHull: number;

    driveId: ShipDriveId;

    pointDefense: {
        id: string;

        pointDefenseId:
            PointDefenseId;
    };

    defenseCapacitor: {
        id: string;

        defenseCapacitorId:
            DefenseCapacitorId;
    };

    weapons: PlayerShipWeaponPreset[];
};

export const PLAYER_SHIP_PRESETS = {
    [PLAYER_SHIP_PRESET_ID.STARTER_00]: {
        id: PLAYER_SHIP_PRESET_ID.STARTER_00,

        maxHull: 3,

        driveId: SHIP_DRIVE_ID.BASIC_00,

        pointDefense: {
            id:
                'point_defense_player_00',

            pointDefenseId:
                POINT_DEFENSE_ID
                    .BASIC_00,
        },

        defenseCapacitor: {
            id:
                'defense_capacitor_player_00',

            defenseCapacitorId:
                DEFENSE_CAPACITOR_ID
                    .BASIC_00,
        },

        weapons: [
            {
                id: 'laser_player_00',

                weaponId: SHIP_WEAPON_ID.LASER_00,
            },

            {
                id: 'missile_launcher_player_00',

                weaponId: SHIP_WEAPON_ID.MISSILE_LAUNCHER_00,

                presetId: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,
            },

            {
                id:
                    'sticky_mine_dispenser_player_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .STICKY_MINE_DISPENSER_00,

                presetId:
                    STICKY_MINE_DISPENSER_PRESET_ID
                        .BASIC_FULL_00,
            },

            {
                id:
                    'spam_projector_player_00',

                weaponId:
                    SHIP_WEAPON_ID
                        .SPAM_PROJECTOR_00,
            },
        ],
    },
} satisfies Record<PlayerShipPresetId, PlayerShipPreset>;
