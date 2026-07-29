// tests/fixtures/engine/point_defense_fixtures.ts

import type { PointDefenseState } from '../../../src/engine/defs/point_defense';

const DEFAULT_MAX_CHARGES = 4;

export function createPointDefenseFixture(
    charges = DEFAULT_MAX_CHARGES,
    maxCharges = DEFAULT_MAX_CHARGES,
): PointDefenseState {
    return {
        charges,
        maxCharges,
    };
}
