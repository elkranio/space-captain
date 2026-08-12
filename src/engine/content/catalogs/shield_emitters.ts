// src/engine/content/catalogs/shield_emitters.ts

import {
    SHIELD_EMITTER_ID,
    type ShieldEmitterDefinition,
    type ShieldEmitterId,
} from '../../defs/shield_emitter';

export const SHIELD_EMITTERS = {
    [SHIELD_EMITTER_ID.BASIC_00]: {
        id:
            SHIELD_EMITTER_ID.BASIC_00,

        name:
            'BASIC SHIELD EMITTER',

        // Первые gameplay numbers:
        // специально короткое окно,
        // чтобы placement timing имел значение.
        shieldDurationMs: 5000,

        // Пока такой же простой baseline.
        // Балансируем отдельно после полного shield flow.
        cooldownDurationMs: 5000,
    },
} satisfies Record<
    ShieldEmitterId,
    ShieldEmitterDefinition
>;
