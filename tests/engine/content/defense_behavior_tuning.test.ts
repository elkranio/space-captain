import powerData from '../../../src/engine/content/data/power_cores.json';
import turretData from '../../../src/engine/content/data/defense_turrets.json';
import shieldData from '../../../src/engine/content/data/shield_generators.json';
import behaviorData from '../../../src/engine/content/data/ship_behaviors.json';
import { describe, expect, it } from 'vitest';
import { POWER_CORES } from '../../../src/engine/content/catalogs/power_cores';
import { DEFENSE_TURRETS } from '../../../src/engine/content/catalogs/defense_turrets';
import { SHIELD_GENERATORS } from '../../../src/engine/content/catalogs/shield_generators';
import { SHIP_BEHAVIOR_PRESETS } from '../../../src/engine/content/presets/ship_behaviors';
import { POWER_CORE_TUNING_SCHEMA } from '../../../src/engine/content/schemas/power_cores';
import { DEFENSE_TURRET_TUNING_SCHEMA } from '../../../src/engine/content/schemas/defense_turrets';
import { SHIELD_GENERATOR_TUNING_SCHEMA } from '../../../src/engine/content/schemas/shield_generators';
import { SHIP_BEHAVIOR_TUNING_SCHEMA } from '../../../src/engine/content/schemas/ship_behaviors';
import { SHIP_SLOT_KIND } from '../../../src/engine/defs/ship_slot';

describe('Defense and ship-behavior content tuning', () => {
    it('loads built-in defense and behavior records', () => {
        for (const [id, tuning] of Object.entries(powerData)) {
            expect(POWER_CORES[id]).toEqual({ id, ...tuning });
        }
        for (const [id, tuning] of Object.entries(turretData)) {
            expect(DEFENSE_TURRETS[id]).toEqual({ id, slotKind: SHIP_SLOT_KIND.DEFENSE, ...tuning });
        }
        for (const [id, tuning] of Object.entries(shieldData)) {
            expect(SHIELD_GENERATORS[id]).toEqual({ id, slotKind: SHIP_SLOT_KIND.DEFENSE, ...tuning });
        }
        expect(SHIP_BEHAVIOR_PRESETS.standard_combat_00).toEqual({
            id: 'standard_combat_00',
            ...behaviorData.standard_combat_00,
        });
    });

    it('rejects invalid defense tuning', () => {
        const power = POWER_CORE_TUNING_SCHEMA.safeParse({
            invalid: { ...powerData.power_core_basic_00, capacity: 0 },
        });
        expect(power.error?.issues.map((issue) => issue.path)).toEqual([['invalid', 'capacity']]);
        const turret = DEFENSE_TURRET_TUNING_SCHEMA.safeParse({
            invalid: { ...turretData.defense_turret_basic_00, loadDurationMs: -1 },
        });
        expect(turret.error?.issues.map((issue) => issue.path)).toEqual([['invalid', 'loadDurationMs']]);
        const shield = SHIELD_GENERATOR_TUNING_SCHEMA.safeParse({
            invalid: { ...shieldData.shield_generator_basic_00, cooldownDurationMs: -1 },
        });
        expect(shield.error?.issues.map((issue) => issue.path)).toEqual([['invalid', 'cooldownDurationMs']]);
    });

    it('rejects invalid behavior tuning', () => {
        expect(
            SHIP_BEHAVIOR_TUNING_SCHEMA.safeParse({
                standard_combat_00: {
                    decisionTickDurationMs: 1000,

                    decisionTickWiggleMs: 250,

                    threatTimingWiggleMs: 500,

                    aggression: 101,
                },
            }).success,
        ).toBe(false);
    });
});
