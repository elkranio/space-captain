import { describe, expect, it } from 'vitest';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../src/engine/content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../src/engine/encounter/model/officer_task';
import {
    createPlayerThreatDecisionTimingSnapshot,
} from '../../../src/engine/encounter/snapshots/create_player_threat_decision_timing_snapshot';

const INTERCEPT_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .GUNNER_DEFENSE_TURRET,
    );

const SHIELD_DEPLOY_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .ENGINEER_DEPLOY_SHIELD,
    );

const CLEAR_MINE_DURATION_MS =
    getTimedOfficerTaskDurationMs(
        OFFICER_TASK_KIND
            .CLEAR_STICKY_MINE,
    );

const SHIELD_DURATION_MS = 5000;

describe(
    'player threat decision timings',
    () => {
        it(
            'derives response thresholds from real task durations',
            () => {
                expect(
                    createPlayerThreatDecisionTimingSnapshot({
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
