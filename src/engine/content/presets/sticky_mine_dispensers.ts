// src/engine/content/presets/sticky_mine_dispensers.ts

import {
    SHIP_WEAPONS,
} from '../catalogs/ship_weapons';
import {
    STICKY_MINE_ID,
    type StickyMineId,
} from '../../defs/sticky_mine';
import {
    SHIP_WEAPON_ID,
} from '../../defs/ship_weapon';

export const STICKY_MINE_DISPENSER_PRESET_ID = {
    BASIC_FULL_00: 'basic_full_00',
} as const;

export type StickyMineDispenserPresetId =
    (typeof STICKY_MINE_DISPENSER_PRESET_ID)[keyof typeof STICKY_MINE_DISPENSER_PRESET_ID];

export type StickyMineDispenserPreset = {
    id: StickyMineDispenserPresetId;

    weaponId:
        typeof SHIP_WEAPON_ID
            .STICKY_MINE_DISPENSER_00;

    loadedMineId: StickyMineId;
    ammoCount: number;
};

export const STICKY_MINE_DISPENSER_PRESETS = {
    [STICKY_MINE_DISPENSER_PRESET_ID.BASIC_FULL_00]: {
        id:
            STICKY_MINE_DISPENSER_PRESET_ID
                .BASIC_FULL_00,

        weaponId:
            SHIP_WEAPON_ID
                .STICKY_MINE_DISPENSER_00,

        loadedMineId:
            STICKY_MINE_ID.BASIC_00,

        ammoCount:
            SHIP_WEAPONS[
                SHIP_WEAPON_ID
                    .STICKY_MINE_DISPENSER_00
            ].ammoCapacity,
    },
} satisfies Record<
    StickyMineDispenserPresetId,
    StickyMineDispenserPreset
>;
