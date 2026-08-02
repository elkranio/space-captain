// src/engine/generation/ship_weapon/StickyMineDispenserFactory.ts

import {
    SHIP_WEAPONS,
} from '../../content/catalogs/ship_weapons';
import {
    STICKY_MINE_DISPENSER_PRESETS,
    type StickyMineDispenserPresetId,
} from '../../content/presets/sticky_mine_dispensers';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../defs/ship_weapon';

export type CreateStickyMineDispenserInput = {
    // Runtime id конкретного установленного dispenser.
    id: string;

    presetId: StickyMineDispenserPresetId;

    // Нужен тестам и отдельным encounter setups.
    // Без override используется значение preset.
    ammoCount?: number;
};

// Собирает свежий mutable state установленного dispenser
// из immutable content preset и weapon definition.
export default class StickyMineDispenserFactory {
    public static create({
        id,
        presetId,
        ammoCount,
    }: CreateStickyMineDispenserInput): StickyMineDispenserState {
        const preset =
            STICKY_MINE_DISPENSER_PRESETS[
                presetId
            ];

        const definition =
            SHIP_WEAPONS[
                preset.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                `Cannot create sticky-mine dispenser from definition: ` +
                    `${definition.id}/${definition.kind}`,
            );
        }

        const resolvedAmmoCount =
            ammoCount ??
            preset.ammoCount;

        if (
            !Number.isInteger(
                resolvedAmmoCount,
            ) ||
            resolvedAmmoCount < 0 ||
            resolvedAmmoCount >
                definition.ammoCapacity
        ) {
            throw new Error(
                `Invalid sticky-mine dispenser ammo count: ` +
                    `${resolvedAmmoCount}/${definition.ammoCapacity}`,
            );
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            loadedMineId:
                preset.loadedMineId,

            ammoCount:
                resolvedAmmoCount,

            phase:
                SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,

            dispensedMineCount: 0,
        };
    }
}
