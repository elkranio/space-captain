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
            'selects the first available Gunner attack in loadout order',
            () => {
                const snapshot =
                    createSnapshot();

                const policy =
                    new EnemyDecisionPolicy();

                expect(
                    policy.selectWork(
                        snapshot,
                    ),
                ).toEqual(
                    weaponIntent(
                        'missile_launcher_00',
                    ),
                );

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
                ).toEqual(
                    weaponIntent(
                        'beam_cannon_00',
                    ),
                );

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
                ).toEqual(
                    weaponIntent(
                        'sticky_mine_dispenser_00',
                    ),
                );
            },
        );

        it(
            'does not invent Gunner work when every Gunner tool is unavailable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.GUNNER,
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

                        operatorBusyDurationMs:
                            3000,

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

                        operatorBusyDurationMs:
                            15000,
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

                        operatorBusyDurationMs:
                            5000,

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
            'falls through to Scientist offense when Gunner is unavailable',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.SCIENTIST,
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
                        OFFICER_ROLE.SCIENTIST,

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
                    OFFICER_ROLE.GUNNER,
                ];

                snapshot.weapons = [];

                installReadyTurret(
                    snapshot,
                );

                snapshot.threats = [
                    missileThreat(
                        'too_late',
                        2500,
                    ),

                    missileThreat(
                        'reachable',
                        6000,
                    ),
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual(
                    turretIntent(
                        'reachable',
                    ),
                );
            },
        );

        it(
            'does not knowingly start a mine clear that cannot finish in time',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.ENGINEER,
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
            'does not fall back to another role when Engineer cannot clear a mine',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.SCIENTIST,
                    OFFICER_ROLE.PILOT,
                    OFFICER_ROLE.GUNNER,
                ];

                snapshot.weapons = [];

                snapshot.threats = [
                    {
                        kind:
                            ENEMY_THREAT_KIND
                                .STICKY_MINE,

                        observationId:
                            'sticky_mine:clearable',

                        mineId:
                            'clearable',

                        estimatedTimeToDetonationMs:
                            7000,
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

                installReadyShield(
                    snapshot,
                );

                snapshot.threats = [
                    beamThreat(
                        2500,
                    ),
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toBeUndefined();

                snapshot.threats = [
                    beamThreat(
                        7000,
                    ),
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual(
                    shieldIntent(),
                );
            },
        );

        it(
            'attacks without aggression RNG when the same-role defense remains reachable afterwards',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.availableRoles = [
                    OFFICER_ROLE.GUNNER,
                ];

                snapshot.weapons = [
                    snapshot.weapons[0],
                ];

                installReadyTurret(
                    snapshot,
                );

                snapshot.threats = [
                    missileThreat(
                        'far',
                        12000,
                    ),
                ];

                const policy =
                    new EnemyDecisionPolicy(
                        () => {
                            throw new Error(
                                'Aggression RNG must not be used for a safe attack',
                            );
                        },
                    );

                expect(
                    policy.selectWork(
                        snapshot,
                    ),
                ).toEqual(
                    weaponIntent(
                        'missile_launcher_00',
                    ),
                );
            },
        );

        it(
            'treats the next captain tick itself as cross-block even when defense uses another role',
            () => {
                const snapshot =
                    createSnapshot();

                snapshot.aggression = 0;

                snapshot.availableRoles = [
                    OFFICER_ROLE.GUNNER,
                    OFFICER_ROLE.ENGINEER,
                ];

                snapshot.weapons = [
                    snapshot.weapons[0],
                ];

                installReadyShield(
                    snapshot,
                );

                snapshot.nextDecisionInMs =
                    1000;

                snapshot.threats = [
                    beamThreat(
                        3500,
                    ),
                ];

                expect(
                    new EnemyDecisionPolicy()
                        .selectWork(
                            snapshot,
                        ),
                ).toEqual(
                    shieldIntent(),
                );
            },
        );

        it(
            'uses aggression only when offense would close a known defense window',
            () => {
                const cautious =
                    createTurretConflictSnapshot();

                cautious.aggression = 50;

                expect(
                    new EnemyDecisionPolicy(
                        () => 0.5,
                    ).selectWork(
                        cautious,
                    ),
                ).toEqual(
                    turretIntent(
                        'urgent',
                    ),
                );

                const aggressive =
                    createTurretConflictSnapshot();

                aggressive.aggression = 50;

                expect(
                    new EnemyDecisionPolicy(
                        () => 0.49,
                    ).selectWork(
                        aggressive,
                    ),
                ).toEqual(
                    weaponIntent(
                        'missile_launcher_00',
                    ),
                );
            },
        );

        it(
            'makes aggression endpoints deterministic without consuming RNG',
            () => {
                const cautious =
                    createTurretConflictSnapshot();

                cautious.aggression = 0;

                const noRandom =
                    () => {
                        throw new Error(
                            'Endpoint aggression must not consume RNG',
                        );
                    };

                expect(
                    new EnemyDecisionPolicy(
                        noRandom,
                    ).selectWork(
                        cautious,
                    ),
                ).toEqual(
                    turretIntent(
                        'urgent',
                    ),
                );

                const reckless =
                    createTurretConflictSnapshot();

                reckless.aggression = 100;

                expect(
                    new EnemyDecisionPolicy(
                        noRandom,
                    ).selectWork(
                        reckless,
                    ),
                ).toEqual(
                    weaponIntent(
                        'missile_launcher_00',
                    ),
                );
            },
        );
    },
);

function createTurretConflictSnapshot():
    EnemyCaptainDecisionSnapshot {
    const snapshot =
        createSnapshot();

    snapshot.availableRoles = [
        OFFICER_ROLE.GUNNER,
    ];

    snapshot.weapons = [
        snapshot.weapons[0],
    ];

    installReadyTurret(
        snapshot,
    );

    snapshot.nextDecisionInMs =
        1000;

    snapshot.threats = [
        missileThreat(
            'urgent',
            5500,
        ),
    ];

    return snapshot;
}

function installReadyTurret(
    snapshot:
        EnemyCaptainDecisionSnapshot,
): void {
    snapshot.defenseTurret = {
        id:
            'defense_turret_00',

        phase:
            DEFENSE_TURRET_PHASE
                .READY,

        loadDurationMs: 3000,
    };

    snapshot.powerCoreCharges = 4;
}

function installReadyShield(
    snapshot:
        EnemyCaptainDecisionSnapshot,
): void {
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
}

function missileThreat(
    projectileId: string,
    estimatedTimeToImpactMs:
        number,
): EnemyCaptainDecisionSnapshot[
    'threats'
][number] {
    return {
        kind:
            ENEMY_THREAT_KIND
                .MISSILE,

        observationId:
            'missile:' +
            projectileId,

        projectileId,

        estimatedTimeToImpactMs,
    };
}

function beamThreat(
    estimatedRemainingChargeMs:
        number,
): EnemyCaptainDecisionSnapshot[
    'threats'
][number] {
    return {
        kind:
            ENEMY_THREAT_KIND
                .BEAM_CANNON,

        observationId:
            'beam:00',

        officerTaskId:
            'task_00',

        weaponId:
            'player_beam_00',

        estimatedRemainingChargeMs,
    };
}

function weaponIntent(
    weaponId: string,
) {
    return {
        kind:
            SHIP_CREW_TASK_KIND
                .OPERATE_WEAPON,

        role:
            OFFICER_ROLE.GUNNER,

        weaponId,
    };
}

function turretIntent(
    projectileId: string,
) {
    return {
        kind:
            SHIP_CREW_TASK_KIND
                .INTERCEPT_MISSILE,

        role:
            OFFICER_ROLE.GUNNER,

        defenseTurretId:
            'defense_turret_00',

        projectileId,
    };
}

function shieldIntent() {
    return {
        kind:
            SHIP_CREW_TASK_KIND
                .DEPLOY_SHIELD,

        role:
            OFFICER_ROLE.ENGINEER,

        observationId:
            'beam:00',
    };
}

function createSnapshot():
    EnemyCaptainDecisionSnapshot {
    return {
        actorId:
            'ship_enemy_combat_00',

        aggression: 50,

        nextDecisionInMs: 1000,

        availableRoles: [
            OFFICER_ROLE.GUNNER,
            OFFICER_ROLE.SCIENTIST,
            OFFICER_ROLE.ENGINEER,
            OFFICER_ROLE.PILOT,
        ],

        claimedStickyMineIds: [],

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

                operatorBusyDurationMs:
                    3000,

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

                operatorBusyDurationMs:
                    15000,
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

                operatorBusyDurationMs:
                    5000,

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

                operatorBusyDurationMs:
                    23000,

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
