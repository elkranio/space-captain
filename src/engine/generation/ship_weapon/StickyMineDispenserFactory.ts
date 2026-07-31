// src/engine/generation/ship_weapon/StickyMineDispenserFactory.ts

import {
    SHIP_WEAPONS,
} from '../../content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_ID,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type StickyMineDispenserState,
} from '../../defs/ship_weapon';

export type CreateStickyMineDispenserInput = {
    // Runtime id конкретного установленного dispenser.
    id: string;

    weaponId:
        typeof SHIP_WEAPON_ID.STICKY_MINE_DISPENSER_00;
};

export default class StickyMineDispenserFactory {
    public static create({
        id,
        weaponId,
    }: CreateStickyMineDispenserInput): StickyMineDispenserState {
        const definition =
            SHIP_WEAPONS[weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER
        ) {
            throw new Error(
                `Cannot create sticky-mine dispenser from definition: ` +
                    `${definition.id}/${definition.kind}`,
            );
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,

            dispensedMineCount: 0,
        };
    }
}
