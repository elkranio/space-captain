// tests/fixtures/engine/power_core_fixtures.ts

import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import PowerCoreFactory from '../../../src/engine/generation/ship_system/PowerCoreFactory';

export function createPowerCoreFixture(
    charges = 4,
    rechargeElapsedMs = 0,
) {
    return PowerCoreFactory.create({
        id:
            'power_core_player_test_00',

        powerCoreId:
            POWER_CORE_ID
                .BASIC_00,

        charges,
        rechargeElapsedMs,
    });
}
