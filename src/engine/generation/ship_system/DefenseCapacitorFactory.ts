// src/engine/generation/ship_system/DefenseCapacitorFactory.ts

import {
    DEFENSE_CAPACITORS,
} from '../../content/catalogs/defense_capacitors';
import type {
    DefenseCapacitorId,
    DefenseCapacitorState,
} from '../../defs/defense_capacitor';

export type CreateDefenseCapacitorInput = {
    // Runtime id конкретной установки.
    id: string;

    defenseCapacitorId:
        DefenseCapacitorId;

    // Test/setup seams.
    // По умолчанию capacitor создаётся полным.
    charges?: number;
    rechargeElapsedMs?: number;
};

export default class DefenseCapacitorFactory {
    public static create({
        id,
        defenseCapacitorId,
        charges,
        rechargeElapsedMs = 0,
    }: CreateDefenseCapacitorInput):
        DefenseCapacitorState {
        const definition =
            DEFENSE_CAPACITORS[
                defenseCapacitorId
            ];

        const resolvedCharges =
            charges ??
            definition.capacity;

        if (
            !Number.isInteger(
                resolvedCharges,
            ) ||
            resolvedCharges < 0 ||
            resolvedCharges >
                definition.capacity
        ) {
            throw new Error(
                'Invalid defense capacitor charge count: ' +
                    id +
                    '/' +
                    resolvedCharges +
                    '/' +
                    definition.capacity,
            );
        }

        if (
            !Number.isFinite(
                rechargeElapsedMs,
            ) ||
            rechargeElapsedMs < 0 ||
            rechargeElapsedMs >=
                definition
                    .rechargeDurationMs
        ) {
            throw new Error(
                'Invalid defense capacitor recharge elapsed: ' +
                    id +
                    '/' +
                    rechargeElapsedMs +
                    '/' +
                    definition
                        .rechargeDurationMs,
            );
        }

        if (
            resolvedCharges ===
                definition.capacity &&
            rechargeElapsedMs !== 0
        ) {
            throw new Error(
                'Full defense capacitor must have zero recharge elapsed: ' +
                    id +
                    '/' +
                    rechargeElapsedMs,
            );
        }

        return {
            id,
            defenseCapacitorId,

            charges:
                resolvedCharges,

            rechargeElapsedMs,
        };
    }
}
