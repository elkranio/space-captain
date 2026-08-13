// src/engine/content/catalogs/missiles.ts

import missileTuningData from '../data/missiles.json';
import {
    MISSILE_TUNING_SCHEMA,
} from '../schemas/missiles';
import {
    MISSILE_ID,
    type MissileDefinition,
    type MissileId,
} from '../../defs/missile';

const MISSILE_TUNING =
    MISSILE_TUNING_SCHEMA.parse(
        missileTuningData,
    );

export const MISSILES = {
    [MISSILE_ID.BASIC_00]: {
        id:
            MISSILE_ID.BASIC_00,

        ...MISSILE_TUNING[
            MISSILE_ID.BASIC_00
        ],
    },

    [MISSILE_ID.BASIC_01]: {
        id:
            MISSILE_ID.BASIC_01,

        ...MISSILE_TUNING[
            MISSILE_ID.BASIC_01
        ],
    },
} satisfies Record<
    MissileId,
    MissileDefinition
>;
