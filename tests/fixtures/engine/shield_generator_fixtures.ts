// tests/fixtures/engine/shield_generator_fixtures.ts

import {
    SHIELD_GENERATOR_PRESET_ID,
} from '../../../src/engine/content/presets/shield_generators';
import type {
    ShieldGeneratorState,
} from '../../../src/engine/defs/shield_generator';
import ShieldGeneratorFactory from '../../../src/engine/generation/ship_system/ShieldGeneratorFactory';

export function createShieldGeneratorFixture(): ShieldGeneratorState {
    return ShieldGeneratorFactory.create({
        presetId:
            SHIELD_GENERATOR_PRESET_ID.BASIC_00,
    });
}
