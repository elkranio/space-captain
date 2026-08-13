// src/engine/content/catalogs/point_defenses.ts

import pointDefenseTuningData from '../data/point_defenses.json';
import {
    POINT_DEFENSE_TUNING_SCHEMA,
} from '../schemas/point_defenses';
import {
    POINT_DEFENSE_ID,
    type PointDefenseDefinition,
    type PointDefenseId,
} from '../../defs/point_defense';

const POINT_DEFENSE_TUNING =
    POINT_DEFENSE_TUNING_SCHEMA.parse(
        pointDefenseTuningData,
    );

export const POINT_DEFENSES = {
    [POINT_DEFENSE_ID.BASIC_00]: {
        id:
            POINT_DEFENSE_ID.BASIC_00,

        ...POINT_DEFENSE_TUNING[
            POINT_DEFENSE_ID.BASIC_00
        ],
    },
} satisfies Record<
    PointDefenseId,
    PointDefenseDefinition
>;
