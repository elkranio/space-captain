// src/engine/encounter/combat/defense/spend_power_core_charge.ts

import type {
    PowerCoreState,
} from '../../../defs/power_core';

// One mutation rule for every defensive consumer.
//
// Spending Power Core charges restarts the sequential recharge
// of the next charge. Defensive consumers share this resource
// instead of owning separate energy pools.
export function spendPowerCoreCharges(
    powerCore: PowerCoreState,
    count: number,
): PowerCoreState {
    if (
        !Number.isInteger(count) ||
        count <= 0
    ) {
        throw new Error(
            'Power Core spend count must be a positive integer: ' +
                String(count),
        );
    }

    // Validate the whole spend before mutating so a failed
    // multi-charge commitment can never partially drain power.
    if (
        powerCore.charges <
        count
    ) {
        throw new Error(
            'Cannot spend defense-powerCore charges: ' +
                powerCore.id +
                '/' +
                powerCore.charges +
                '/' +
                count,
        );
    }

    powerCore.charges -=
        count;

    powerCore.rechargeElapsedMs =
        0;

    return {
        ...powerCore,
    };
}

export function spendPowerCoreCharge(
    powerCore: PowerCoreState,
): PowerCoreState {
    return spendPowerCoreCharges(
        powerCore,
        1,
    );
}
