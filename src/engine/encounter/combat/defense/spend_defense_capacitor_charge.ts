// src/engine/encounter/combat/defense/spend_defense_capacitor_charge.ts

import type {
    DefenseCapacitorState,
} from '../../../defs/defense_capacitor';

// One mutation rule for every defensive consumer.
//
// Spending a charge restarts the sequential recharge
// of the next charge. Defensive consumers share this
// resource instead of owning separate energy pools.
export function spendDefenseCapacitorCharge(
    capacitor:
        DefenseCapacitorState,
): DefenseCapacitorState {
    if (capacitor.charges <= 0) {
        throw new Error(
            'Cannot spend defense-capacitor charge: ' +
                capacitor.id +
                '/empty',
        );
    }

    capacitor.charges -= 1;
    capacitor.rechargeElapsedMs = 0;

    return {
        ...capacitor,
    };
}
