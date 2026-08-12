// tests/engine/encounter/enemy_debug_snapshot.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    DEFENSE_CAPACITOR_ID,
} from '../../../src/engine/defs/defense_capacitor';
import {
    ENCOUNTER_TEAM,
} from '../../../src/engine/defs/encounter_team';
import {
    MISSILE_ID,
} from '../../../src/engine/defs/missile';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_ID,
    POINT_DEFENSE_PHASE,
} from '../../../src/engine/defs/point_defense';
import {
    getEnemyDebugSnapshots,
} from '../../../src/engine/encounter/debug/get_enemy_debug_snapshots';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type MissileCombatProjectileState,
} from '../../../src/engine/encounter/model/combat';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import type {
    EncounterState,
} from '../../../src/engine/encounter/model/state';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';

describe(
    'Enemy debug snapshot',
    () => {
        it(
            'separates crew work, Science report and missile truth',
            () => {
                const projectile:
                    MissileCombatProjectileState = {
                        id:
                            'projectile_player_00',

                        designation: 'M1',

                        kind:
                            COMBAT_PROJECTILE_KIND
                                .MISSILE,

                        source: {
                            kind:
                                COMBAT_SOURCE_KIND
                                    .PLAYER_SHIP,
                        },

                        sourceWeaponId:
                            'player_launcher_00',

                        target: {
                            kind:
                                COMBAT_TARGET_KIND
                                    .ACTOR,

                            actorId:
                                'ship_enemy_00',
                        },

                        identification: {
                            status:
                                THREAT_IDENTIFICATION_STATUS
                                    .UNKNOWN,
                        },

                        missileId:
                            MISSILE_ID.BLUE_00,

                        timeToImpactMs:
                            9000,

                        initialTimeToImpactMs:
                            12000,
                    };

                const state = {
                    actors: [
                        {
                            id:
                                'ship_enemy_00',

                            team:
                                ENCOUNTER_TEAM.ENEMY,

                            hull: 10,

                            crewRoles: [
                                OFFICER_ROLE
                                    .SCIENCE,

                                OFFICER_ROLE
                                    .WEAPONS,

                                OFFICER_ROLE
                                    .ENGINEER,
                            ],

                            crewTasks: {
                                [OFFICER_ROLE
                                    .SCIENCE]: {
                                    kind:
                                        SHIP_CREW_TASK_KIND
                                            .IDENTIFY_THREAT,

                                    role:
                                        OFFICER_ROLE
                                            .SCIENCE,

                                    observationId:
                                        'missile:' +
                                        projectile.id,

                                    elapsedMs:
                                        1000,

                                    durationMs:
                                        3000,
                                },

                                [OFFICER_ROLE
                                    .WEAPONS]: {
                                    kind:
                                        SHIP_CREW_TASK_KIND
                                            .INTERCEPT_MISSILE,

                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    pointDefenseId:
                                        'point_defense_00',

                                    projectileId:
                                        projectile.id,

                                    beamBand:
                                        POINT_DEFENSE_BEAM_BAND
                                            .BLUE,
                                },
                            },

                            threatObservations: [
                                {
                                    id:
                                        'missile:' +
                                        projectile.id,

                                    kind:
                                        ENEMY_THREAT_KIND
                                            .MISSILE,

                                    source: {
                                        kind:
                                            ENEMY_THREAT_SOURCE_KIND
                                                .COMBAT_PROJECTILE,

                                        projectileId:
                                            projectile.id,
                                    },

                                    report: {
                                        kind:
                                            ENEMY_THREAT_KIND
                                                .MISSILE,

                                        spectralBand:
                                            POINT_DEFENSE_BEAM_BAND
                                                .RED,
                                    },
                                },
                            ],

                            defenseCapacitor: {
                                id:
                                    'defense_capacitor_00',

                                defenseCapacitorId:
                                    DEFENSE_CAPACITOR_ID
                                        .BASIC_00,

                                charges: 3,
                                rechargeElapsedMs:
                                    12000,
                            },

                            pointDefense: {
                                id:
                                    'point_defense_00',

                                pointDefenseId:
                                    POINT_DEFENSE_ID
                                        .BASIC_00,

                                phase:
                                    POINT_DEFENSE_PHASE
                                        .LOADING,

                                phaseElapsedMs:
                                    1000,

                                loadedBand:
                                    POINT_DEFENSE_BEAM_BAND
                                        .BLUE,

                                targetProjectileId:
                                    projectile.id,
                            },

                            weapons: [],
                        },
                    ],

                    officerTasks: {},

                    combat: {
                        projectiles: [
                            projectile,
                        ],

                        laserAttacks: [],
                        stickyMines: [],
                        playerWeapons: [],
                    },
                } as unknown as
                    EncounterState;

                expect(
                    getEnemyDebugSnapshots(
                        state,
                    ),
                ).toEqual([
                    {
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

                        defenseCapacitor: {
                            charges: 3,
                            capacity: 4,

                            rechargeProgress: {
                                elapsedMs:
                                    12000,

                                durationMs:
                                    24000,
                            },
                        },

                        pointDefense: {
                            phase:
                                POINT_DEFENSE_PHASE
                                    .LOADING,

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
                                    projectile.id,

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
                    },
                ]);
            },
        );
    },
);
