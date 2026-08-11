// tests/fixtures/engine/point_defense_fixtures.ts

import {
    POINT_DEFENSE_ID,
    type PointDefenseState,
} from '../../../src/engine/defs/point_defense';

// Legacy optional args stay in the fixture signature for this migration
// so unrelated test setup keeps compiling. Production PD no longer stores them.
// Tests that actually depended on an empty PD pool must move that setup to
// DEFENSE CAPACITOR and will fail behaviorally rather than hiding the migration.
export function createPointDefenseFixture(
    _legacyCharges = 4,
    _legacyMaxCharges = 4,
): PointDefenseState {
    return {
        id:
            'point_defense_player_test_00',

        pointDefenseId:
            POINT_DEFENSE_ID
                .BASIC_00,
    };
}
