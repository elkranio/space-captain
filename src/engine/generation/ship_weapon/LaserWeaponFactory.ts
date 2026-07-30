// src/engine/generation/ship_weapon/LaserWeaponFactory.ts

import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import { SHIP_WEAPON_ID, SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type LaserWeaponState } from '../../defs/ship_weapon';

export type CreateLaserWeaponInput = {
    // Runtime id конкретного установленного лазера.
    id: string;

    weaponId: typeof SHIP_WEAPON_ID.LASER_00;
};

export default class LaserWeaponFactory {
    public static create({ id, weaponId }: CreateLaserWeaponInput): LaserWeaponState {
        const definition = SHIP_WEAPONS[weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.LASER) {
            throw new Error(`Cannot create laser weapon from definition: ` + `${definition.id}/${definition.kind}`);
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
        };
    }
}
