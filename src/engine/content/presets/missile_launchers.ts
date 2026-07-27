// src/engine/content/presets/missile_launchers.ts

import { MISSILE_ID, type MissileId } from '../../defs/missile';
import { SHIP_WEAPON_ID, type ShipWeaponId } from '../../defs/ship_weapon';
import { SHIP_WEAPONS } from '../catalogs/ship_weapons';

export const MISSILE_LAUNCHER_PRESET_ID = {
    BASIC_HEAT_FULL_00: 'basic_heat_full_00',
} as const;

export type MissileLauncherPresetId = (typeof MISSILE_LAUNCHER_PRESET_ID)[keyof typeof MISSILE_LAUNCHER_PRESET_ID];

export type MissileLauncherPreset = {
    id: MissileLauncherPresetId;

    weaponId: ShipWeaponId;

    loadedMissileId: MissileId | null;
    ammoCount: number;
};

const basicHeatLauncher = SHIP_WEAPONS[SHIP_WEAPON_ID.HEAT_MISSILE_LAUNCHER_00];

export const MISSILE_LAUNCHER_PRESETS = {
    [MISSILE_LAUNCHER_PRESET_ID.BASIC_HEAT_FULL_00]: {
        id: MISSILE_LAUNCHER_PRESET_ID.BASIC_HEAT_FULL_00,

        weaponId: basicHeatLauncher.id,

        loadedMissileId: MISSILE_ID.HEAT_00,

        ammoCount: basicHeatLauncher.ammoCapacity,
    },
} satisfies Record<MissileLauncherPresetId, MissileLauncherPreset>;
