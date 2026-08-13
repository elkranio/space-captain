import {
    MISSILE_SIGNATURE,
} from '../../../src/engine/defs/missile';
// tests/engine/encounter/enemy_debug_snapshot.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    POWER_CORE_ID,
} from '../../../src/engine/defs/power_core';
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
    DEFENSE_TURRET_SIGNATURE,
    DEFENSE_TURRET_ID,
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
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

                        signature:
                            MISSILE_SIGNATURE.B,

            identification: {
                            status:
                                THREAT_IDENTIFICATION_STATUS
                                    .UNKNOWN,
                        },

                        missileId:
                            MISSILE_ID.BASIC_01,

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

                                    defenseTurretId:
                                        'defense_turret_00',

                                    projectileId:
                                        projectile.id,

                                    signature:
                                        DEFENSE_TURRET_SIGNATURE
                                            .B,
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

                                        signature:
                                            DEFENSE_TURRET_SIGNATURE
                                                .A,
                                    },
                                },
                            ],

                            powerCore: {
                                id:
                                    'power_core_00',

                                powerCoreId:
                                    POWER_CORE_ID
                                        .BASIC_00,

                                charges: 3,
                                rechargeElapsedMs:
                                    12000,
                            },

                            defenseTurret: {
                                id:
                                    'defense_turret_00',

                                defenseTurretId:
                                    DEFENSE_TURRET_ID
                                        .BASIC_00,

                                phase:
                                    DEFENSE_TURRET_PHASE
                                        .LOADING,

                                phaseElapsedMs:
                                    1000,

                                loadedSignature:
                                    DEFENSE_TURRET_SIGNATURE
                                        .B,

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
                                        'INTERCEPT M1 SIGNATURE_B',

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

                        powerCore: {
                            charges: 3,
                            capacity: 4,

                            rechargeProgress: {
                                elapsedMs:
                                    12000,

                                durationMs:
                                    24000,
                            },
                        },

                        defenseTurret: {
                            phase:
                                DEFENSE_TURRET_PHASE
                                    .LOADING,

                            loadedSignature:
                                DEFENSE_TURRET_SIGNATURE
                                    .B,

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
                                    DEFENSE_TURRET_SIGNATURE
                                        .A,

                                truth:
                                    DEFENSE_TURRET_SIGNATURE
                                        .B,

                                mismatch: true,
                            },
                        ],
                    },
                ]);
            },
        );
    },
);
