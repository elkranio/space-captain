// src/engine/encounter/combat/defense/spend_power_core_charge.ts

import type {
    PowerCoreState,
} from '../../../defs/power_core';

// One mutation rule for every defensive consumer.
//
// Spending a charge restarts the sequential recharge
// of the next charge. Defensive consumers share this
// resource instead of owning separate energy pools.
export function spendPowerCoreCharge(
    powerCore:
        PowerCoreState,
): PowerCoreState {
    if (powerCore.charges <= 0) {
        throw new Error(
            'Cannot spend defense-powerCore charge: ' +
                powerCore.id +
                '/empty',
        );
    }

    powerCore.charges -= 1;
    powerCore.rechargeElapsedMs = 0;

    return {
        ...powerCore,
    };
}
