import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
    type ShieldGeneratorState,
} from '../../../src/engine/defs/shield_generator';
import {
    advanceShieldGenerator,
} from '../../../src/engine/encounter/combat/defense/ShieldGeneratorRunner';

describe(
    'ShieldGeneratorRunner',
    () => {
        it(
            'advances cooldown to READY at the installed emitter duration',
            () => {
                const emitter:
                    ShieldGeneratorState = {
                        id:
                            'shield_generator_player_00',

                        shieldGeneratorId:
                            SHIELD_GENERATOR_ID
                                .BASIC_00,

                        status:
                            SHIELD_GENERATOR_STATUS
                                .ONLINE,

                        phase:
                            SHIELD_GENERATOR_PHASE
                                .COOLDOWN,

                        phaseElapsedMs:
                            4200,
                    };

                advanceShieldGenerator(
                    emitter,
                    799,
                );

                expect(
                    emitter,
                ).toEqual({
                    id:
                        'shield_generator_player_00',

                    shieldGeneratorId:
                        SHIELD_GENERATOR_ID
                            .BASIC_00,

                    status:
                        SHIELD_GENERATOR_STATUS
                            .ONLINE,

                    phase:
                        SHIELD_GENERATOR_PHASE
                            .COOLDOWN,

                    phaseElapsedMs:
                        4999,
                });

                advanceShieldGenerator(
                    emitter,
                    1,
                );

                expect(
                    emitter.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .READY,
                );

                expect(
                    emitter.phaseElapsedMs,
                ).toBe(0);
            },
        );

        it(
            'does not advance cooldown while emitter is broken',
            () => {
                const emitter:
                    ShieldGeneratorState = {
                        id:
                            'shield_generator_player_00',

                        shieldGeneratorId:
                            SHIELD_GENERATOR_ID
                                .BASIC_00,

                        status:
                            SHIELD_GENERATOR_STATUS
                                .BROKEN,

                        phase:
                            SHIELD_GENERATOR_PHASE
                                .COOLDOWN,

                        phaseElapsedMs:
                            1200,
                    };

                advanceShieldGenerator(
                    emitter,
                    9000,
                );

                expect(
                    emitter.phase,
                ).toBe(
                    SHIELD_GENERATOR_PHASE
                        .COOLDOWN,
                );

                expect(
                    emitter.phaseElapsedMs,
                ).toBe(1200);
            },
        );
    },
);
