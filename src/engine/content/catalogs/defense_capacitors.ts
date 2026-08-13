// src/engine/content/catalogs/defense_capacitors.ts

import defenseCapacitorTuningData from '../data/defense_capacitors.json';
import {
    DEFENSE_CAPACITOR_TUNING_SCHEMA,
} from '../schemas/defense_capacitors';
import {
    DEFENSE_CAPACITOR_ID,
    type DefenseCapacitorDefinition,
    type DefenseCapacitorId,
} from '../../defs/defense_capacitor';

const DEFENSE_CAPACITOR_TUNING =
    DEFENSE_CAPACITOR_TUNING_SCHEMA.parse(
        defenseCapacitorTuningData,
    );

export const DEFENSE_CAPACITORS = {
    [DEFENSE_CAPACITOR_ID
        .BASIC_00]: {
        id:
            DEFENSE_CAPACITOR_ID
                .BASIC_00,

        ...DEFENSE_CAPACITOR_TUNING[
            DEFENSE_CAPACITOR_ID
                .BASIC_00
        ],
    },
} satisfies Record<
    DefenseCapacitorId,
    DefenseCapacitorDefinition
>;
