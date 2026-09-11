import { CREW_ACTIONS } from '../../../src/engine/content/catalogs/crew_actions';
import { SHIELD_GENERATORS } from '../../../src/engine/content/catalogs/shield_generators';
import { DEFENSE_TURRETS } from '../../../src/engine/content/catalogs/defense_turrets';
import { describe, expect, it } from 'vitest';
import {
    createPlayerThreatDecisionTimingSnapshot,
} from '../../../src/engine/encounter/snapshots/create_player_threat_decision_timing_snapshot';

const INTERCEPT_DURATION_MS =
    DEFENSE_TURRETS['defense_turret_basic_00'].loadDurationMs;

const SHIELD_DEPLOY_DURATION_MS =
    SHIELD_GENERATORS['shield_generator_basic_00'].deploymentDurationMs;

const CLEAR_MINE_DURATION_MS =
    CREW_ACTIONS
        .clear_sticky_mine.durationMs;

const SHIELD_DURATION_MS = 5000;

describe(
    'player threat decision timings',
    () => {
        it('omits defensive windows when the equipment is not installed', () => {
            const timings = createPlayerThreatDecisionTimingSnapshot({ crewProgressMultiplier: 1 });
            expect(timings.missile.interceptMinRemainingMs).toBeNull();
            expect(timings.beam.shieldWindow).toBeNull();
            expect(timings.stickyMine.clearMinRemainingMs).toBe(CLEAR_MINE_DURATION_MS);
        });

        it(
            'derives response thresholds from real task durations',
            () => {
                expect(
                    createPlayerThreatDecisionTimingSnapshot({
                        defenseTurretLoadDurationMs: INTERCEPT_DURATION_MS,
                        shieldDeploymentDurationMs: SHIELD_DEPLOY_DURATION_MS,
                        crewProgressMultiplier: 1,
                        shieldDurationMs:
                            SHIELD_DURATION_MS,
                    }),
                ).toEqual({
                    missile: {
                        interceptMinRemainingMs:
                            INTERCEPT_DURATION_MS,
                    },

                    beam: {
                        shieldWindow: {
                            opensAtRemainingMs:
                                SHIELD_DEPLOY_DURATION_MS +
                                SHIELD_DURATION_MS,

                            closesAtRemainingMs:
                                SHIELD_DEPLOY_DURATION_MS,
                        },
                    },

                    stickyMine: {
                        clearMinRemainingMs:
                            CLEAR_MINE_DURATION_MS,
                    },
                });
            },
        );

        it(
            'expands task thresholds using current crew slowdown',
            () => {
                const multiplier = 0.5;

                const timings =
                    createPlayerThreatDecisionTimingSnapshot({
                        defenseTurretLoadDurationMs: INTERCEPT_DURATION_MS,
                        shieldDeploymentDurationMs: SHIELD_DEPLOY_DURATION_MS,
                        crewProgressMultiplier:
                            multiplier,

                        shieldDurationMs:
                            SHIELD_DURATION_MS,
                    });

                expect(
                    timings.missile
                        .interceptMinRemainingMs,
                ).toBe(
                    INTERCEPT_DURATION_MS /
                        multiplier,
                );

                expect(
                    timings.beam
                        .shieldWindow,
                ).toEqual({
                    opensAtRemainingMs:
                        SHIELD_DEPLOY_DURATION_MS /
                            multiplier +
                        SHIELD_DURATION_MS,

                    closesAtRemainingMs:
                        SHIELD_DEPLOY_DURATION_MS /
                        multiplier,
                });

                expect(
                    timings.stickyMine
                        .clearMinRemainingMs,
                ).toBe(
                    CLEAR_MINE_DURATION_MS /
                        multiplier,
                );
            },
        );

        it(
            'reports no nominal task window when crew progress is stopped',
            () => {
                expect(
                    createPlayerThreatDecisionTimingSnapshot({
                        defenseTurretLoadDurationMs: INTERCEPT_DURATION_MS,
                        shieldDeploymentDurationMs: SHIELD_DEPLOY_DURATION_MS,
                        crewProgressMultiplier: 0,
                        shieldDurationMs:
                            SHIELD_DURATION_MS,
                    }),
                ).toEqual({
                    missile: {
                        interceptMinRemainingMs:
                            null,
                    },

                    beam: {
                        shieldWindow:
                            null,
                    },

                    stickyMine: {
                        clearMinRemainingMs:
                            null,
                    },
                });
            },
        );
    },
);
