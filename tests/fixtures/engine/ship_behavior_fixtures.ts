// tests/fixtures/engine/ship_behavior_fixtures.ts

import {
    SHIP_BEHAVIOR_PRESETS,
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../../src/engine/content/presets/ship_behaviors';
import type {
    ShipBehaviorState,
} from '../../../src/engine/defs/ship_behavior';

export function createShipBehaviorFixture(): ShipBehaviorState {
    const preset =
        SHIP_BEHAVIOR_PRESETS[
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00
        ];

    return {
        decisionTickDurationMs:
            preset.decisionTickDurationMs,

        decisionTickWiggleMs:
            preset.decisionTickWiggleMs,

        threatTimingWiggleMs:
            preset.threatTimingWiggleMs,

        aggression:
            preset.aggression,

    };
}
