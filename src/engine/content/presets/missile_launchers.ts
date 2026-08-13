// src/engine/content/presets/missile_launchers.ts

import { MISSILE_ID, type MissileId } from '../../defs/missile';
import { SHIP_WEAPON_ID, type ShipWeaponId } from '../../defs/ship_weapon';
import { SHIP_WEAPONS } from '../catalogs/ship_weapons';

export const MISSILE_LAUNCHER_PRESET_ID = {
    BASIC_RED_FULL_00: 'basic_red_full_00',
    BASIC_BLUE_FULL_00: 'basic_blue_full_00',
} as const;

export type MissileLauncherPresetId = (typeof MISSILE_LAUNCHER_PRESET_ID)[keyof typeof MISSILE_LAUNCHER_PRESET_ID];

export type MissileLauncherPreset = {
    id: MissileLauncherPresetId;

    weaponId: ShipWeaponId;

    loadedMissileId: MissileId | null;
    ammoCount: number;
};

const basicLauncher = SHIP_WEAPONS[SHIP_WEAPON_ID.MISSILE_LAUNCHER_00];

export const MISSILE_LAUNCHER_PRESETS = {
    [MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00]: {
        id: MISSILE_LAUNCHER_PRESET_ID.BASIC_RED_FULL_00,

        weaponId: basicLauncher.id,

        loadedMissileId: MISSILE_ID.BASIC_00,

        ammoCount: basicLauncher.ammoCapacity,
    },
    [MISSILE_LAUNCHER_PRESET_ID.BASIC_BLUE_FULL_00]: {
        id: MISSILE_LAUNCHER_PRESET_ID.BASIC_BLUE_FULL_00,

        weaponId: basicLauncher.id,

        loadedMissileId: MISSILE_ID.BASIC_01,
        ammoCount: basicLauncher.ammoCapacity,
    },
} satisfies Record<MissileLauncherPresetId, MissileLauncherPreset>;
