// src/engine/generation/ship_system/PowerCoreFactory.ts

import {
    POWER_CORES,
} from '../../content/catalogs/power_cores';
import type {
    PowerCoreId,
    PowerCoreState,
} from '../../defs/power_core';

export type CreatePowerCoreInput = {
    // Runtime id конкретной установки.
    id: string;

    powerCoreId:
        PowerCoreId;

    // Test/setup seams.
    // По умолчанию powerCore создаётся полным.
    charges?: number;
    rechargeElapsedMs?: number;
};

export default class PowerCoreFactory {
    public static create({
        id,
        powerCoreId,
        charges,
        rechargeElapsedMs = 0,
    }: CreatePowerCoreInput):
        PowerCoreState {
        const definition =
            POWER_CORES[
                powerCoreId
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
                'Invalid power core charge count: ' +
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
                'Invalid power core recharge elapsed: ' +
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
                'Full power core must have zero recharge elapsed: ' +
                    id +
                    '/' +
                    rechargeElapsedMs,
            );
        }

        return {
            id,
            powerCoreId,

            charges:
                resolvedCharges,

            rechargeElapsedMs,
        };
    }
}
