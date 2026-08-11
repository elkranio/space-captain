// src/engine/content/catalogs/defense_capacitors.ts

import {
    DEFENSE_CAPACITOR_ID,
    type DefenseCapacitorDefinition,
    type DefenseCapacitorId,
} from '../../defs/defense_capacitor';

export const DEFENSE_CAPACITORS = {
    [DEFENSE_CAPACITOR_ID.BASIC_00]: {
        id:
            DEFENSE_CAPACITOR_ID
                .BASIC_00,

        name:
            'MK.I DEFENSE CAPACITOR',

        capacity: 4,

        // Baseline для первого gameplay pass.
        // Позже сравним slow combat regen
        // с effectively-no-combat-regen вариантом.
        rechargeDurationMs: 24000,
    },
} satisfies Record<
    DefenseCapacitorId,
    DefenseCapacitorDefinition
>;
