// tests/engine/encounter/enemy_decision_policy.test.ts

import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../src/engine/defs/officer';
import {
    DEFENSE_TURRET_PHASE,
} from '../../../src/engine/defs/defense_turret';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../src/engine/defs/ship_weapon';
import {
    SHIELD_GENERATOR_ID,
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../src/engine/defs/shield_generator';
import EnemyDecisionPolicy from '../../../src/engine/encounter/combat/enemy/EnemyDecisionPolicy';
import type {
    EnemyCaptainDecisionSnapshot,
} from '../../../src/engine/encounter/combat/queries/get_enemy_captain_decision_snapshot';
import {
    ENEMY_THREAT_KIND,
} from '../../../src/engine/encounter/model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../../src/engine/encounter/model/ship_crew_task';

describe(
    'Enemy decision policy',
    () => {
        it(
            'selects the first available Weapons attack in loadout order',
            () => {
                const snapshot =
                    createSnapshot();

                const policy =
                    new EnemyDecisionPolicy();

                expect(
                    policy.selectWork(
                        snapshot,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'missile_launcher_00',
                });

                snapshot.weapons = [
                    {
                        ...snapshot.weapons[0],

                        phase:
                            SHIP_WEAPON_PHASE
                                .COOLDOWN,
                    },

                    ...snapshot.weapons.slice(
                        1,
                    ),
                ];

                expect(
                    policy.selectWork(
                        snapshot,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'beam_cannon_00',
                });

                snapshot.weapons = [
                    snapshot.weapons[0],

                    {
                        ...snapshot.weapons[1],

                        phase:
                            SHIP_WEAPON_PHASE
                                .COOLDOWN,
                    },

                    ...snapshot.weapons.slice(
                        2,
                    ),
                ];

                expect(
                    policy.selectWork(
                        snapshot,
                    ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    weaponId:
                        'sticky_mine_dispenser_00',
                });
            },
        );

        it(
            'does not invent Weapons work when every Weapons tool is unavailable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.WEAPONS,
                ];

                snapshot.weapons = [
                    {
                        id:
                            'missile_launcher_00',

                        kind:
                            SHIP_WEAPON_KIND
                                .MISSILE_LAUNCHER,

                        phase:
                            SHIP_WEAPON_PHASE
                                .COOLDOWN,

                        ammoCount: 5,
                    },

                    {
                        id:
                            'beam_cannon_00',

                        kind:
                            SHIP_WEAPON_KIND
                                .BEAM_CANNON,

                        phase:
                            SHIP_WEAPON_PHASE
                                .COOLDOWN,
                    },

                    {
                        id:
                            'sticky_mine_dispenser_00',

                        kind:
                            SHIP_WEAPON_KIND
                                .STICKY_MINE_DISPENSER,

                        phase:
                            SHIP_WEAPON_PHASE
                                .READY,

                        ammoCount: 0,
                    },
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toBeUndefined();
            },
        );

        it(
            'falls through to Science offense when Weapons is unavailable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.SCIENCE,
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    weaponId:
                        'spam_projector_00',
                });
            },
        );

        it(
            'intercepts the earliest missile that still looks reachable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.WEAPONS,
                ];

                snapshot.weapons = [];

                snapshot.defenseTurret = {
                    id:
                        'defense_turret_00',

                    phase:
                        DEFENSE_TURRET_PHASE
                            .READY,

                    loadDurationMs: 3000,
                };

                snapshot.powerCoreCharges = 4;

                snapshot.threats = [
                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .MISSILE,

                        observationId:
                            'missile:too_late',

                        projectileId:
                            'too_late',

                        estimatedTimeToImpactMs:
                            2500,
                    },

                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .MISSILE,

                        observationId:
                            'missile:reachable',

                        projectileId:
                            'reachable',

                        estimatedTimeToImpactMs:
                            6000,
                    },
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .INTERCEPT_MISSILE,

                    role:
                        OFFICER_ROLE.WEAPONS,

                    defenseTurretId:
                        'defense_turret_00',

                    projectileId:
                        'reachable',
                });
            },
        );

        it(
            'does not knowingly start a mine clear that cannot finish in time',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.HELM,
                ];

                snapshot.weapons = [];

                snapshot.threats = [
                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .STICKY_MINE,

                        observationId:
                            'sticky_mine:late',

                        mineId:
                            'late',

                        estimatedTimeToDetonationMs:
                            2500,
                    },
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toBeUndefined();
            },
        );

        it(
            'uses estimated beam timing for the shield deployment window',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.ENGINEER,
                ];

                snapshot.weapons = [];

                snapshot.powerCoreCharges = 4;

                snapshot.shieldGenerator = {
                    shieldGeneratorId:
                        SHIELD_GENERATOR_ID
                            .BASIC_00,

                    status:
                        SHIELD_GENERATOR_STATUS
                            .ONLINE,

                    phase:
                        SHIELD_GENERATOR_PHASE
                            .READY,
                };

                snapshot.threats = [
                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .BEAM_CANNON,

                        observationId:
                            'beam:00',

                        officerTaskId:
                            'task_00',

                        weaponId:
                            'player_beam_00',

                        estimatedRemainingChargeMs:
                            2500,
                    },
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toBeUndefined();

                snapshot.threats = [
                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .BEAM_CANNON,

                        observationId:
                            'beam:00',

                        officerTaskId:
                            'task_00',

                        weaponId:
                            'player_beam_00',

                        estimatedRemainingChargeMs:
                            7000,
                    },
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .DEPLOY_SHIELD,

                    role:
                        OFFICER_ROLE.ENGINEER,

                    observationId:
                        'beam:00',
                });
            },
        );

        it(
            'uses idle Science to identify an unresolved missile when interception is unavailable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot
                    .unresolvedMissileObservationIds = [
                        'missile:projectile_00',
                    ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual({
                    kind:
                        SHIP_CREW_TASK_KIND
                            .IDENTIFY_THREAT,

                    role:
                        OFFICER_ROLE.SCIENCE,

                    observationId:
                        'missile:projectile_00',
                });
            },
        );
    },
);

function createSnapshot():
    EnemyCaptainDecisionSnapshot {
    return {
        actorId:
            'ship_enemy_combat_00',

        aggression: 50,

        availableRoles: [
            OFFICER_ROLE.WEAPONS,
            OFFICER_ROLE.SCIENCE,
            OFFICER_ROLE.ENGINEER,
            OFFICER_ROLE.HELM,
        ],

        claimedStickyMineIds: [],

        unresolvedMissileObservationIds:
            [],

        weapons: [
            {
                id:
                    'missile_launcher_00',

                kind:
                    SHIP_WEAPON_KIND
                        .MISSILE_LAUNCHER,

                phase:
                    SHIP_WEAPON_PHASE
                        .READY,

                ammoCount: 5,
            },

            {
                id:
                    'beam_cannon_00',

                kind:
                    SHIP_WEAPON_KIND
                        .BEAM_CANNON,

                phase:
                    SHIP_WEAPON_PHASE
                        .READY,
            },

            {
                id:
                    'sticky_mine_dispenser_00',

                kind:
                    SHIP_WEAPON_KIND
                        .STICKY_MINE_DISPENSER,

                phase:
                    SHIP_WEAPON_PHASE
                        .READY,

                ammoCount: 5,
            },

            {
                id:
                    'spam_projector_00',

                kind:
                    SHIP_WEAPON_KIND
                        .SPAM_PROJECTOR,

                phase:
                    SHIP_WEAPON_PHASE
                        .READY,

                activeChannelId:
                    null,
            },
        ],

        powerCoreCharges: 0,

        hasActiveShield: false,

        threats: [],

        incomingSpamChannelIds: [],
    };
}
