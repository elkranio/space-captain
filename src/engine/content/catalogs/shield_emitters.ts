// src/engine/content/catalogs/shield_emitters.ts

import shieldEmitterTuningData from '../data/shield_emitters.json';
import {
    SHIELD_EMITTER_TUNING_SCHEMA,
} from '../schemas/shield_emitters';
import {
    SHIELD_EMITTER_ID,
    type ShieldEmitterDefinition,
    type ShieldEmitterId,
} from '../../defs/shield_emitter';

const SHIELD_EMITTER_TUNING =
    SHIELD_EMITTER_TUNING_SCHEMA.parse(
        shieldEmitterTuningData,
    );

export const SHIELD_EMITTERS = {
    [SHIELD_EMITTER_ID.BASIC_00]: {
        id:
            SHIELD_EMITTER_ID.BASIC_00,

        ...SHIELD_EMITTER_TUNING[
            SHIELD_EMITTER_ID.BASIC_00
        ],
    },
} satisfies Record<
    ShieldEmitterId,
    ShieldEmitterDefinition
>;
