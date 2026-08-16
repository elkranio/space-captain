// src/engine/generation/ship_weapon/BeamCannonFactory.ts

import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonState,
    type ShipWeaponId,
} from '../../defs/ship_weapon';

export type CreateBeamCannonWeaponInput = {
    // Runtime id конкретного установленного лазера.
    id: string;

    weaponId: ShipWeaponId;
};

export default class BeamCannonFactory {
    public static create({ id, weaponId }: CreateBeamCannonWeaponInput): BeamCannonState {
        const definition = SHIP_WEAPONS[weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error(`Cannot create beamCannon weapon from definition: ` + `${definition.id}/${definition.kind}`);
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,
        };
    }
}
