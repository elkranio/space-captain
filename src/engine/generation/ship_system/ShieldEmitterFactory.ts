// src/engine/generation/ship_system/ShieldEmitterFactory.ts

import {
    SHIELD_EMITTERS,
} from '../../content/catalogs/shield_emitters';
import {
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
    type ShieldEmitterId,
    type ShieldEmitterState,
} from '../../defs/shield_emitter';

export type CreateShieldEmitterInput = {
    id: string;

    shieldEmitterId:
        ShieldEmitterId;
};

export default class ShieldEmitterFactory {
    public static create({
        id,
        shieldEmitterId,
    }: CreateShieldEmitterInput): ShieldEmitterState {
        const definition =
            SHIELD_EMITTERS[
                shieldEmitterId
            ];

        if (!definition) {
            throw new Error(
                'Unknown shield emitter definition: ' +
                    String(
                        shieldEmitterId,
                    ),
            );
        }

        return {
            id,

            shieldEmitterId:
                definition.id,

            status:
                SHIELD_EMITTER_STATUS.ONLINE,

            phase:
                SHIELD_EMITTER_PHASE.READY,

            phaseElapsedMs: 0,
        };
    }
}
