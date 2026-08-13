import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_CAPACITORS,
} from '../../../src/engine/content/catalogs/defense_capacitors';
import {
    POINT_DEFENSES,
} from '../../../src/engine/content/catalogs/point_defenses';
import {
    SHIELD_EMITTERS,
} from '../../../src/engine/content/catalogs/shield_emitters';
import {
    SHIP_BEHAVIOR_PRESETS,
} from '../../../src/engine/content/presets/ship_behaviors';
import {
    DEFENSE_CAPACITOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/defense_capacitors';
import {
    POINT_DEFENSE_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/point_defenses';
import {
    SHIELD_EMITTER_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/shield_emitters';
import {
    SHIP_BEHAVIOR_TUNING_SCHEMA,
} from '../../../src/engine/content/schemas/ship_behaviors';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    POINT_DEFENSE_ID,
} from '../../../src/engine/defs/point_defense';
import {
    SHIELD_EMITTER_ID,
} from '../../../src/engine/defs/shield_emitter';
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
                    DEFENSE_CAPACITORS[
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        DEFENSE_CAPACITOR_ID
                            .BASIC_00,

                    name:
                        'MK.I DEFENSE CAPACITOR',

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
                    SHIELD_EMITTERS[
                        SHIELD_EMITTER_ID
                            .BASIC_00
                    ],
                ).toEqual({
                    id:
                        SHIELD_EMITTER_ID
                            .BASIC_00,

                    name:
                        'BASIC SHIELD EMITTER',

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
                    DEFENSE_CAPACITOR_TUNING_SCHEMA
                        .safeParse({
                            defense_capacitor_basic_00: {
                                name:
                                    'MK.I DEFENSE CAPACITOR',
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
                    SHIELD_EMITTER_TUNING_SCHEMA
                        .safeParse({
                            shield_emitter_basic_00: {
                                name:
                                    'BASIC SHIELD EMITTER',
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
