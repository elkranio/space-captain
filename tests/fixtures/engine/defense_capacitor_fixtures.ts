// tests/fixtures/engine/defense_capacitor_fixtures.ts

import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import DefenseCapacitorFactory from '../../../src/engine/generation/ship_system/DefenseCapacitorFactory';

export function createDefenseCapacitorFixture(
    charges = 4,
    rechargeElapsedMs = 0,
) {
    return DefenseCapacitorFactory.create({
        id:
            'defense_capacitor_player_test_00',

        defenseCapacitorId:
            DEFENSE_CAPACITOR_ID
                .BASIC_00,

        charges,
        rechargeElapsedMs,
    });
}
