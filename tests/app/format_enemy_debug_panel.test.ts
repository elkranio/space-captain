// tests/app/format_enemy_debug_panel.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_PHASE,
} from '../../src/engine/defs/point_defense';
import {
    ENEMY_THREAT_KIND,
} from '../../src/engine/encounter/model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../src/engine/encounter/model/ship_crew_task';
import {
    formatEnemyDebugPanel,
} from '../../src/app/scenes/game/bridge/view/ui/enemy_debug/format_enemy_debug_panel';

describe(
    'Enemy debug panel formatter',
    () => {
        it(
            'prints crew work, PD state and report mismatch',
            () => {
                expect(
                    formatEnemyDebugPanel({
                        actorId:
                            'ship_enemy_00',

                        roles: [
                            {
                                role:
                                    OFFICER_ROLE
                                        .SCIENCE,

                                present: true,

                                task: {
                                    kind:
                                        SHIP_CREW_TASK_KIND
                                            .IDENTIFY_THREAT,

                                    label:
                                        'IDENTIFY M1',

                                    progress: {
                                        elapsedMs:
                                            1000,

                                        durationMs:
                                            3000,
                                    },
                                },
                            },

                            {
                                role:
                                    OFFICER_ROLE
                                        .WEAPONS,

                                present: true,

                                task: {
                                    kind:
                                        SHIP_CREW_TASK_KIND
                                            .INTERCEPT_MISSILE,

                                    label:
                                        'INTERCEPT M1 BLUE',

                                    progress: {
                                        elapsedMs:
                                            1000,

                                        durationMs:
                                            3000,
                                    },
                                },
                            },

                            {
                                role:
                                    OFFICER_ROLE
                                        .ENGINEER,

                                present: true,
                            },

                            {
                                role:
                                    OFFICER_ROLE
                                        .HELM,

                                present: false,
                            },
                        ],

                        pointDefense: {
                            phase:
                                POINT_DEFENSE_PHASE
                                    .LOADING,

                            charges: 3,
                            maxCharges: 3,

                            loadedBand:
                                POINT_DEFENSE_BEAM_BAND
                                    .BLUE,

                            targetLabel:
                                'M1',

                            progress: {
                                elapsedMs:
                                    1000,

                                durationMs:
                                    3000,
                            },
                        },

                        threats: [
                            {
                                id:
                                    'missile:' +
                                    'projectile_player_00',

                                label: 'M1',

                                kind:
                                    ENEMY_THREAT_KIND
                                        .MISSILE,

                                status:
                                    'active',

                                remainingMs:
                                    9000,

                                report:
                                    POINT_DEFENSE_BEAM_BAND
                                        .RED,

                                truth:
                                    POINT_DEFENSE_BEAM_BAND
                                        .BLUE,

                                mismatch: true,
                            },
                        ],
                    }),
                ).toEqual({
                    crew:
                        'SCI  IDENTIFY M1 1.0/3.0\n' +
                        'WPN  INTERCEPT M1 BLUE 1.0/3.0\n' +
                        'ENG  IDLE\n' +
                        'HELM ABSENT',

                    systems:
                        'PD LOAD M1 BLUE 1.0/3.0 3/3',

                    threats:
                        'M1 MSL ETA 09.0 RPT RED TRUE BLUE !',
                });
            },
        );
    },
);
