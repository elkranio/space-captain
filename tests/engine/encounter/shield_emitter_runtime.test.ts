import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    SHIELD_EMITTER_ID,
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
    type ShieldEmitterState,
} from '../../../src/engine/defs/shield_emitter';
import {
    advanceShieldEmitter,
} from '../../../src/engine/encounter/combat/defense/ShieldEmitterRunner';

describe(
    'ShieldEmitterRunner',
    () => {
        it(
            'advances cooldown to READY at the installed emitter duration',
            () => {
                const emitter:
                    ShieldEmitterState = {
                        id:
                            'shield_emitter_player_00',

                        shieldEmitterId:
                            SHIELD_EMITTER_ID
                                .BASIC_00,

                        status:
                            SHIELD_EMITTER_STATUS
                                .ONLINE,

                        phase:
                            SHIELD_EMITTER_PHASE
                                .COOLDOWN,

                        phaseElapsedMs:
                            4200,
                    };

                advanceShieldEmitter(
                    emitter,
                    799,
                );

                expect(
                    emitter,
                ).toEqual({
                    id:
                        'shield_emitter_player_00',

                    shieldEmitterId:
                        SHIELD_EMITTER_ID
                            .BASIC_00,

                    status:
                        SHIELD_EMITTER_STATUS
                            .ONLINE,

                    phase:
                        SHIELD_EMITTER_PHASE
                            .COOLDOWN,

                    phaseElapsedMs:
                        4999,
                });

                advanceShieldEmitter(
                    emitter,
                    1,
                );

                expect(
                    emitter.phase,
                ).toBe(
                    SHIELD_EMITTER_PHASE
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
                    ShieldEmitterState = {
                        id:
                            'shield_emitter_player_00',

                        shieldEmitterId:
                            SHIELD_EMITTER_ID
                                .BASIC_00,

                        status:
                            SHIELD_EMITTER_STATUS
                                .BROKEN,

                        phase:
                            SHIELD_EMITTER_PHASE
                                .COOLDOWN,

                        phaseElapsedMs:
                            1200,
                    };

                advanceShieldEmitter(
                    emitter,
                    9000,
                );

                expect(
                    emitter.phase,
                ).toBe(
                    SHIELD_EMITTER_PHASE
                        .COOLDOWN,
                );

                expect(
                    emitter.phaseElapsedMs,
                ).toBe(1200);
            },
        );
    },
);
