// src/engine/content/catalogs/point_defenses.ts

import {
    POINT_DEFENSE_ID,
    type PointDefenseDefinition,
    type PointDefenseId,
} from '../../defs/point_defense';

export const POINT_DEFENSES = {
    [POINT_DEFENSE_ID.BASIC_00]: {
        id: POINT_DEFENSE_ID.BASIC_00,
        name: 'BASIC POINT DEFENSE',

        loadDurationMs: 3000,
        cooldownDurationMs: 5000,
    },
} satisfies Record<
    PointDefenseId,
    PointDefenseDefinition
>;
