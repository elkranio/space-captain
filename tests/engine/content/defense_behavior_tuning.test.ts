import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POWER_CORES,
} from '../../../src/engine/content/catalogs/power_cores';
import {
    DEFENSE_TURRETS,
} from '../../../src/engine/content/catalogs/defense_turrets';
import {
    SHIELD_GENERATORS,
} from '../../../src/engine/content/catalogs/shield_generators';
import {
    SHIP_BEHAVIOR_PRESETS,
} from '../../../src/engine/content/presets/ship_behaviors';
import {
    POWER_CORE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/power_cores';
import {
    DEFENSE_TURRET_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/defense_turrets';
import {
    SHIELD_GENERATOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/shield_generators';
import {
    SHIP_BEHAVIOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_behaviors';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
import {
    DEFENSE_TURRET_ID,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIELD_GENERATOR_ID,
} from '../../../src/engine/defs/shield_generator';
import {
    SHIP_BEHAVIOR_PRESET_ID,
} from '../../../src/engine/defs/ship_behavior';

describe(
    'Defense and ship-behavior content tuning',
    () => {
        it(
            'loads built-in defense and behavior records',
            () => {
                expect(
                    POWER_CORES[
                        POWER_CORE_ID.BASIC_00
                    ].id,
                ).toBe(
                    POWER_CORE_ID.BASIC_00,
                );

                expect(
                    DEFENSE_TURRETS[
                        DEFENSE_TURRET_ID.BASIC_00
                    ].id,
                ).toBe(
                    DEFENSE_TURRET_ID.BASIC_00,
                );

                expect(
                    SHIELD_GENERATORS[
                        SHIELD_GENERATOR_ID.BASIC_00
                    ].id,
                ).toBe(
                    SHIELD_GENERATOR_ID.BASIC_00,
                );

                expect(
                    SHIP_BEHAVIOR_PRESETS[
                        SHIP_BEHAVIOR_PRESET_ID
                            .STANDARD_COMBAT_00
                    ].id,
                ).toBe(
                    SHIP_BEHAVIOR_PRESET_ID
                        .STANDARD_COMBAT_00,
                );
            },
        );

        it(
            'rejects invalid defense tuning',
            () => {
                expect(
                    POWER_CORE_TUNING_SCHEMA
                        .safeParse({
                            power_core_basic_00: {
                                name:
                                    'MK.I POWER CORE',
                                capacity: 0,
                                rechargeDurationMs:
                                    24000,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    DEFENSE_TURRET_TUNING_SCHEMA
                        .safeParse({
                            defense_turret_basic_00: {
                                name:
                                    'BASIC DEFENSE TURRET',
                                loadDurationMs:
                                    -1,
                                cooldownDurationMs:
                                    5000,
                            },
                        })
                        .success,
                ).toBe(false);

                expect(
                    SHIELD_GENERATOR_TUNING_SCHEMA
                        .safeParse({
                            shield_generator_basic_00: {
                                name:
                                    'BASIC SHIELD GENERATOR',
                                shieldDurationMs:
                                    5000,
                                cooldownDurationMs:
                                    -1,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );

        it(
            'rejects invalid behavior tuning',
            () => {
                expect(
                    SHIP_BEHAVIOR_TUNING_SCHEMA
                        .safeParse({
                            standard_combat_00: {
                                decisionTickDurationMs:
                                    1000,

                                decisionTickWiggleMs:
                                    250,

                                threatTimingWiggleMs:
                                    500,

                                disablePlayerDriveAtCombatStart:
                                    false,

                                aggression: 101,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );
    },
);
