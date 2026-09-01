// src/engine/generation/ship_weapon/SpamProjectorFactory.ts

import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type SpamProjectorState } from "../../defs/ship_weapon";

export type CreateSpamProjectorInput = {
    // Runtime id конкретного установленного spam projector.
    id: string;

    weaponId: string;
};

export default class SpamProjectorFactory {
    public static create({ id, weaponId }: CreateSpamProjectorInput): SpamProjectorState {
        const definition = SHIP_WEAPONS[weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
            throw new Error(`Cannot create spam projector from definition: ` + `${definition.id}/${definition.kind}`);
        }

        return {
            id,

            weaponId: definition.id,
            kind: definition.kind,

            phase: SHIP_WEAPON_PHASE.READY,
            phaseElapsedMs: 0,
            cooldownRemainingMs: 0,

            activeChannelId: null,
            channelPurged: false,
        };
    }
}
