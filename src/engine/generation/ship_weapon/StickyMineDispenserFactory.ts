// src/engine/generation/ship_weapon/StickyMineDispenserFactory.ts

import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponId,
    type StickyMineDispenserState,
} from "../../defs/ship_weapon";

export type CreateStickyMineDispenserInput = {
    id: string;
    weaponId: ShipWeaponId;
    ammoCount?: number;
};

// Fresh installed dispenser state comes directly from immutable weapon content.
// There is no separate sticky-mine/ammo content entity.
export default class StickyMineDispenserFactory {
    public static create({ id, weaponId, ammoCount }: CreateStickyMineDispenserInput): StickyMineDispenserState {
        const definition = SHIP_WEAPONS[weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
            throw new Error(
                "Cannot create sticky-mine dispenser from weapon definition: " + `${definition.id}/${definition.kind}`,
            );
        }

        const resolvedAmmoCount = ammoCount ?? definition.ammoCapacity;

        if (
            !Number.isInteger(resolvedAmmoCount) ||
            resolvedAmmoCount < 0 ||
            resolvedAmmoCount > definition.ammoCapacity
        ) {
            throw new Error(
                "Invalid sticky-mine dispenser ammo count: " + `${resolvedAmmoCount}/${definition.ammoCapacity}`,
            );
        }

        return {
            id,
            weaponId: definition.id,
            kind: definition.kind,
            ammoCount: resolvedAmmoCount,
            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,
            dispensedMineCount: 0,
        };
    }
}
