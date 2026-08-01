// src/engine/generation/ship_system/ShieldGeneratorFactory.ts

import {
    SHIELD_GENERATOR_PRESETS,
    type ShieldGeneratorPresetId,
} from '../../content/presets/shield_generators';
import type {
    ShieldGeneratorState,
} from '../../defs/shield_generator';

export type CreateShieldGeneratorInput = {
    presetId: ShieldGeneratorPresetId;

    // Нужен тестам и отдельным encounter setups.
    // Без override генератор создаётся полностью заряженным.
    charges?: number;
};

// Собирает свежий mutable state установленного генератора
// из immutable content preset.
export default class ShieldGeneratorFactory {
    public static create({
        presetId,
        charges,
    }: CreateShieldGeneratorInput): ShieldGeneratorState {
        const preset =
            SHIELD_GENERATOR_PRESETS[presetId];

        const resolvedCharges =
            charges ?? preset.maxCharges;

        if (
            !Number.isInteger(resolvedCharges) ||
            resolvedCharges < 0 ||
            resolvedCharges > preset.maxCharges
        ) {
            throw new Error(
                `Invalid shield generator charge count: ` +
                `${resolvedCharges}/${preset.maxCharges}`,
            );
        }

        return {
            charges: resolvedCharges,
            maxCharges: preset.maxCharges,

            chargeRegenerationDurationMs:
                preset.chargeRegenerationDurationMs,
            chargeRegenerationElapsedMs: 0,
        };
    }
}
