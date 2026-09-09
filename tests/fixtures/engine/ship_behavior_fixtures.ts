// tests/fixtures/engine/ship_behavior_fixtures.ts

import {
    STANDARD_COMBAT_SHIP_BEHAVIOR,
} from '../../../src/engine/content/presets/ship_behaviors';
import type {
    ShipBehaviorState,
} from '../../../src/engine/defs/ship_behavior';

export function createShipBehaviorFixture(): ShipBehaviorState {
    return {
        ...STANDARD_COMBAT_SHIP_BEHAVIOR,
    };
}
