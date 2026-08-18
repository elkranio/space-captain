// src/engine/generation/ship_weapon/MissileLauncherFactory.ts

import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
    type ShipWeaponId,
} from "../../defs/ship_weapon";

export type CreateMissileLauncherInput = {
    id: string;
    weaponId: ShipWeaponId;
    ammoCount?: number;
};

// Fresh installed launcher state comes directly from immutable weapon content.
// There is no separate missile/ammo content entity.
export default class MissileLauncherFactory {
    public static create({ id, weaponId, ammoCount }: CreateMissileLauncherInput): MissileLauncherState {
        const definition = SHIP_WEAPONS[weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
            throw new Error(
                "Cannot create missile launcher from weapon definition: " + `${definition.id}/${definition.kind}`,
            );
        }

        const resolvedAmmoCount = ammoCount ?? definition.ammoCapacity;

        if (
            !Number.isInteger(resolvedAmmoCount) ||
            resolvedAmmoCount < 0 ||
            resolvedAmmoCount > definition.ammoCapacity
        ) {
            throw new Error(
                "Invalid missile launcher ammo count: " + `${resolvedAmmoCount}/${definition.ammoCapacity}`,
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
        };
    }
}
