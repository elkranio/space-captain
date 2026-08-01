// tests/engine/ShieldGeneratorPreset.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIELD_GENERATOR_PRESET_ID,
} from '../../src/engine/content/presets/shield_generators';
import ShieldGeneratorFactory from '../../src/engine/generation/ship_system/ShieldGeneratorFactory';

describe('Shield generator preset', () => {
    it('creates a fully charged generator with no regeneration progress', () => {
        const generator =
            ShieldGeneratorFactory.create({
                presetId:
                    SHIELD_GENERATOR_PRESET_ID.BASIC_00,
            });

        expect(generator).toEqual({
            charges: 3,
            maxCharges: 3,

            chargeRegenerationDurationMs: 20000,
            chargeRegenerationElapsedMs: 0,
        });
    });

    it('rejects an invalid charge override', () => {
        expect(() => {
            ShieldGeneratorFactory.create({
                presetId:
                    SHIELD_GENERATOR_PRESET_ID.BASIC_00,

                charges: 4,
            });
        }).toThrow(
            'Invalid shield generator charge count: 4/3',
        );
    });
});
