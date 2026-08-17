import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    advanceShipEvade,
    createReadyShipEvadeState,
    isShipEvading,
    SHIP_EVADE_PHASE,
    startShipEvade,
    stopShipEvade,
    type ShipEvadeTiming,
} from '../../../src/engine/defs/ship_evade';

const TIMING: ShipEvadeTiming = {
    evadeWarmupMs: 1000,
    evadeDurationMs: 3000,
    evadeCooldownMs: 20000,
};

describe(
    'Ship Evade lifecycle',
    () => {
        it(
            'starts warmup and commits the full cooldown immediately',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    TIMING,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.WARMUP,
                    phaseElapsedMs: 0,
                    cooldownRemainingMs:
                        TIMING.evadeCooldownMs,
                });

                expect(
                    isShipEvading(state),
                ).toBe(false);
            },
        );

        it(
            'crosses warmup and active boundaries while cooldown advances in raw time',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    TIMING,
                );

                advanceShipEvade(
                    state,
                    TIMING,
                    999,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.WARMUP,
                    phaseElapsedMs: 999,
                    cooldownRemainingMs: 19001,
                });

                advanceShipEvade(
                    state,
                    TIMING,
                    1,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.EVADING,
                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 19000,
                });

                expect(
                    isShipEvading(state),
                ).toBe(true);

                advanceShipEvade(
                    state,
                    TIMING,
                    1500,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.EVADING,
                    phaseElapsedMs: 1500,
                    cooldownRemainingMs: 17500,
                });

                advanceShipEvade(
                    state,
                    TIMING,
                    1500,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.COOLDOWN,
                    phaseElapsedMs: 4000,
                    cooldownRemainingMs: 16000,
                });
            },
        );

        it(
            'can cross the whole lifecycle in one world-time step',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    TIMING,
                );

                advanceShipEvade(
                    state,
                    TIMING,
                    25000,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.READY,
                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                });
            },
        );

        it(
            'preserves committed cooldown when stopped during warmup',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    TIMING,
                );

                advanceShipEvade(
                    state,
                    TIMING,
                    400,
                );

                expect(
                    stopShipEvade(
                        state,
                        TIMING,
                    ),
                ).toBe(true);

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.COOLDOWN,
                    phaseElapsedMs: 400,
                    cooldownRemainingMs: 19600,
                });
            },
        );

        it(
            'preserves committed cooldown when stopped during active evade',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    TIMING,
                );

                advanceShipEvade(
                    state,
                    TIMING,
                    1500,
                );

                expect(
                    stopShipEvade(
                        state,
                        TIMING,
                    ),
                ).toBe(true);

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.COOLDOWN,
                    phaseElapsedMs: 1500,
                    cooldownRemainingMs: 18500,
                });

                expect(
                    isShipEvading(state),
                ).toBe(false);
            },
        );

        it(
            'becomes ready immediately when recovery finishes before the active maneuver',
            () => {
                const state =
                    createReadyShipEvadeState();

                const shortRecoveryTiming:
                    ShipEvadeTiming = {
                        evadeWarmupMs: 1000,
                        evadeDurationMs: 3000,
                        evadeCooldownMs: 500,
                    };

                startShipEvade(
                    state,
                    shortRecoveryTiming,
                );

                advanceShipEvade(
                    state,
                    shortRecoveryTiming,
                    1000,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.EVADING,
                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                });

                stopShipEvade(
                    state,
                    shortRecoveryTiming,
                );

                expect(state).toEqual({
                    phase:
                        SHIP_EVADE_PHASE.READY,
                    phaseElapsedMs: 0,
                    cooldownRemainingMs: 0,
                });
            },
        );

        it(
            'supports zero warmup without a fake warmup frame',
            () => {
                const state =
                    createReadyShipEvadeState();

                startShipEvade(
                    state,
                    {
                        ...TIMING,
                        evadeWarmupMs: 0,
                    },
                );

                expect(state.phase).toBe(
                    SHIP_EVADE_PHASE.EVADING,
                );
                expect(
                    isShipEvading(state),
                ).toBe(true);
            },
        );

        it(
            'does not stop ready or cooldown states',
            () => {
                const ready =
                    createReadyShipEvadeState();

                expect(
                    stopShipEvade(
                        ready,
                        TIMING,
                    ),
                ).toBe(false);

                startShipEvade(
                    ready,
                    TIMING,
                );
                advanceShipEvade(
                    ready,
                    TIMING,
                    4000,
                );

                expect(ready.phase).toBe(
                    SHIP_EVADE_PHASE.COOLDOWN,
                );

                expect(
                    stopShipEvade(
                        ready,
                        TIMING,
                    ),
                ).toBe(false);
            },
        );
    },
);
