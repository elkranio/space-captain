import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POWER_CORES,
} from '../../../src/engine/content/catalogs/power_cores';
import {
    POINT_DEFENSES,
} from '../../../src/engine/content/catalogs/point_defenses';
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
    POINT_DEFENSE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/point_defenses';
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
    POINT_DEFENSE_ID,
} from '../../../src/engine/defs/point_defense';
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
            'preserves current defense definitions',
            () => {
                expect(
                    POWER_CORES[
                        POWER_CORE_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        POWER_CORE_ID
                            .BASIC_00,

                    name:
                        'MK.I POWER CORE',

                    capacity: 4,

                    rechargeDurationMs:
                        24000,
                });

                expect(
                    POINT_DEFENSES[
                        POINT_DEFENSE_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        POINT_DEFENSE_ID
                            .BASIC_00,

                    name:
                        'BASIC POINT DEFENSE',

                    loadDurationMs:
                        3000,

                    cooldownDurationMs:
                        5000,
                });

                expect(
                    SHIELD_GENERATORS[
                        SHIELD_GENERATOR_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        SHIELD_GENERATOR_ID
                            .BASIC_00,

                    name:
                        'BASIC SHIELD GENERATOR',

                    shieldDurationMs:
                        5000,

                    cooldownDurationMs:
                        5000,
                });
            },
        );

        it(
            'preserves the current standard enemy behavior preset',
            () => {
                expect(
                    SHIP_BEHAVIOR_PRESETS[
                        SHIP_BEHAVIOR_PRESET_ID
                            .STANDARD_COMBAT_00
                    ],
                ).toEqual({
                    id:
                        SHIP_BEHAVIOR_PRESET_ID
                            .STANDARD_COMBAT_00,

                    offensiveTaskDelayMs:
                        2000,
                });
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
                    POINT_DEFENSE_TUNING_SCHEMA
                        .safeParse({
                            point_defense_basic_00: {
                                name:
                                    'BASIC POINT DEFENSE',
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
                                offensiveTaskDelayMs:
                                    -1,
                            },
                        })
                        .success,
                ).toBe(false);
            },
        );
    },
);
