import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    MISSILE_ID,
    MISSILE_SPECTRAL_BAND,
} from '../../src/engine/defs/missile';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    STICKY_MINE_ID,
} from '../../src/engine/defs/sticky_mine';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type CombatProjectileState,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
} from '../../src/engine/encounter/model/command';
import {
    mapCaptainCombatContextToBridgePayload,
} from '../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper';

describe(
    'BridgeCaptainCombatContextMapper',
    () => {
        it(
            'maps incoming missiles nearest-first with exact resolved threat commands',
            () => {
                const near =
                    createMissile({
                        id:
                            'missile_near',

                        designation:
                            'M2',

                        timeToImpactMs:
                            400,

                        initialTimeToImpactMs:
                            1200,

                        identification: {
                            status:
                                THREAT_IDENTIFICATION_STATUS
                                    .IDENTIFIED,

                            spectralBand:
                                MISSILE_SPECTRAL_BAND
                                    .RED,
                        },
                    });

                const far =
                    createMissile({
                        id:
                            'missile_far',

                        designation:
                            'M1',

                        timeToImpactMs:
                            900,

                        initialTimeToImpactMs:
                            1400,

                        identification: {
                            status:
                                THREAT_IDENTIFICATION_STATUS
                                    .UNKNOWN,
                        },
                    });

                expect(
                    mapCaptainCombatContextToBridgePayload({
                        stickyMineSnapshots:
                            [],

                        availableHelmCommands:
                            [],

                        enemyShips: [],

                        incomingMissiles: [
                            far,
                            near,
                        ],

                        laserThreats:
                            [],

                        availableScienceCommands: [
                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_IDENTIFY_THREAT,

                                far.id,
                            ),
                        ],

                        availableEngineeringCommands:
                            [],

                        availableWeaponsCommands: [
                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_RED_BEAM,

                                far.id,
                            ),

                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_BLUE_BEAM,

                                near.id,
                            ),

                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_FIRE_RED_BEAM,

                                near.id,
                            ),
                        ],
                    }),
                ).toEqual({
                    incomingStickyMines:
                        [],

                    incomingLasers:
                        [],

                    incomingMissiles: [
                        {
                            projectileId:
                                near.id,

                            designation:
                                'M2',

                            timeToImpactMs:
                                400,

                            initialTimeToImpactMs:
                                1200,

                            spectralBand:
                                MISSILE_SPECTRAL_BAND
                                    .RED,

                            actions: {
                                fireRedBeam: {
                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .WEAPONS_FIRE_RED_BEAM,

                                    target: {
                                        kind:
                                            OFFICER_COMMAND_TARGET_KIND
                                                .THREAT,

                                        threatId:
                                            near.id,
                                    },
                                },

                                fireBlueBeam: {
                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .WEAPONS_FIRE_BLUE_BEAM,

                                    target: {
                                        kind:
                                            OFFICER_COMMAND_TARGET_KIND
                                                .THREAT,

                                        threatId:
                                            near.id,
                                    },
                                },
                            },
                        },

                        {
                            projectileId:
                                far.id,

                            designation:
                                'M1',

                            timeToImpactMs:
                                900,

                            initialTimeToImpactMs:
                                1400,

                            actions: {
                                identifyThreat: {
                                    role:
                                        OFFICER_ROLE
                                            .SCIENCE,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .SCIENCE_IDENTIFY_THREAT,

                                    target: {
                                        kind:
                                            OFFICER_COMMAND_TARGET_KIND
                                                .THREAT,

                                        threatId:
                                            far.id,
                                    },
                                },

                                fireRedBeam: {
                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .WEAPONS_FIRE_RED_BEAM,

                                    target: {
                                        kind:
                                            OFFICER_COMMAND_TARGET_KIND
                                                .THREAT,

                                        threatId:
                                            far.id,
                                    },
                                },
                            },
                        },
                    ],
                });
            },
        );

        it(
            'maps current enemy hull and defense capacitor',
            () => {
                expect(
                    mapCaptainCombatContextToBridgePayload({
                        stickyMineSnapshots:
                            [],

                        availableHelmCommands:
                            [],

                        enemyShips: [
                            {
                                actorId:
                                    'enemy_ship_00',

                                hull: {
                                    current: 3,
                                    max: 4,
                                },

                                drive: {
                                    status:
                                        'online',
                                },

                                defenseCapacitor: {
                                    id:
                                        'enemy_def_00',

                                    defenseCapacitorId:
                                        'defense_capacitor_basic_00',

                                    charges: 2,
                                    rechargeElapsedMs:
                                        6000,
                                },

                                weapons: [],
                            },
                        ],

                        incomingMissiles:
                            [],

                        laserThreats:
                            [],

                        availableScienceCommands:
                            [],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands:
                            [],
                    }),
                ).toEqual({
                    incomingStickyMines:
                        [],

                    incomingLasers:
                        [],

                    enemyShip: {
                        actorId:
                            'enemy_ship_00',

                        hull: {
                            current: 3,
                            max: 4,
                        },

                        defenseCapacitor: {
                            current: 2,
                            max: 4,

                            rechargeProgress:
                                0.25,
                        },
                    },

                    incomingMissiles:
                        [],
                });
            },
        );


        it(
            'maps the resolved untargeted Engineer shield command onto laser rows',
            () => {
                const deployShield:
                    AvailableOfficerCommand = {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .ENGINEER_DEPLOY_SHIELD,

                        label:
                            'DEPLOY SHIELD',

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .NONE,
                        },
                    };

                expect(
                    mapCaptainCombatContextToBridgePayload({
                        stickyMineSnapshots:
                            [],

                        availableHelmCommands:
                            [],

                        enemyShips: [],
                        incomingMissiles: [],

                        laserThreats: [
                            {
                                attack: {
                                    id:
                                        'laser_attack_1',

                                    designation:
                                        'L1',

                                    sourceActorId:
                                        'enemy_ship_00',

                                    sourceWeaponId:
                                        'laser_enemy_00',

                                    target: {
                                        kind:
                                            COMBAT_TARGET_KIND
                                                .PLAYER_SHIP,
                                    },
                                },

                                timeToFireMs:
                                    700,

                                initialTimeToFireMs:
                                    1200,
                            },
                        ],

                        availableScienceCommands:
                            [],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands: [
                            deployShield,
                        ],
                    }),
                ).toEqual({
                    incomingStickyMines:
                        [],

                    incomingMissiles: [],

                    incomingLasers: [
                        {
                            attackId:
                                'laser_attack_1',

                            designation:
                                'L1',

                            timeToFireMs:
                                700,

                            initialTimeToFireMs:
                                1200,

                            actions: {
                                deployShield: {
                                    role:
                                        OFFICER_ROLE
                                            .ENGINEER,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .ENGINEER_DEPLOY_SHIELD,

                                    target: {
                                        kind:
                                            OFFICER_COMMAND_TARGET_KIND
                                                .NONE,
                                    },
                                },
                            },
                        },
                    ],
                });
            },
        );

        it(
            'maps attached mines nearest-first and exposes clear actions only on the engine-selected next target',
            () => {
                const clearMine:
                    AvailableOfficerCommand = {
                        commandId:
                            ENCOUNTER_OFFICER_COMMAND_ID
                                .CLEAR_STICKY_MINE,

                        label:
                            'CLEAR MINE',

                        target: {
                            kind:
                                OFFICER_COMMAND_TARGET_KIND
                                    .NONE,
                        },
                    };

                const payload =
                    mapCaptainCombatContextToBridgePayload({
                        enemyShips: [],
                        incomingMissiles: [],
                        laserThreats: [],

                        stickyMineSnapshots: [
                            {
                                mine: {
                                    id:
                                        'mine_later',

                                    mineId:
                                        STICKY_MINE_ID
                                            .BASIC_00,

                                    source: {
                                        kind:
                                            COMBAT_SOURCE_KIND
                                                .ACTOR,

                                        actorId:
                                            'enemy_ship_00',
                                    },

                                    sourceWeaponId:
                                        'sticky_mine_dispenser_00',

                                    target: {
                                        kind:
                                            COMBAT_TARGET_KIND
                                                .PLAYER_SHIP,
                                    },

                                    timeToDetonationMs:
                                        1600,

                                    initialTimeToDetonationMs:
                                        5000,

                                    damage: 1,
                                },

                                isBeingCleared:
                                    true,

                                isNextClearTarget:
                                    false,
                            },

                            {
                                mine: {
                                    id:
                                        'mine_next',

                                    mineId:
                                        STICKY_MINE_ID
                                            .BASIC_00,

                                    source: {
                                        kind:
                                            COMBAT_SOURCE_KIND
                                                .ACTOR,

                                        actorId:
                                            'enemy_ship_00',
                                    },

                                    sourceWeaponId:
                                        'sticky_mine_dispenser_00',

                                    target: {
                                        kind:
                                            COMBAT_TARGET_KIND
                                                .PLAYER_SHIP,
                                    },

                                    timeToDetonationMs:
                                        700,

                                    initialTimeToDetonationMs:
                                        5000,

                                    damage: 1,
                                },

                                isBeingCleared:
                                    false,

                                isNextClearTarget:
                                    true,
                            },
                        ],

                        availableScienceCommands: [
                            clearMine,
                        ],

                        availableHelmCommands: [
                            clearMine,
                        ],

                        availableWeaponsCommands: [
                            clearMine,
                        ],

                        availableEngineeringCommands: [
                            clearMine,
                        ],
                    });

                expect(
                    payload.incomingStickyMines,
                ).toEqual([
                    {
                        mineId:
                            'mine_next',

                        timeToDetonationMs:
                            700,

                        initialTimeToDetonationMs:
                            5000,

                        isBeingCleared:
                            false,

                        isNextClearTarget:
                            true,

                        actions: {
                            scienceClear: {
                                role:
                                    OFFICER_ROLE.SCIENCE,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .NONE,
                                },
                            },

                            helmClear: {
                                role:
                                    OFFICER_ROLE.HELM,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .NONE,
                                },
                            },

                            weaponsClear: {
                                role:
                                    OFFICER_ROLE.WEAPONS,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .NONE,
                                },
                            },

                            engineerClear: {
                                role:
                                    OFFICER_ROLE.ENGINEER,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .NONE,
                                },
                            },
                        },
                    },

                    {
                        mineId:
                            'mine_later',

                        timeToDetonationMs:
                            1600,

                        initialTimeToDetonationMs:
                            5000,

                        isBeingCleared:
                            true,

                        isNextClearTarget:
                            false,

                        actions: {},
                    },
                ]);
            },
        );

        it(
            'rejects duplicate resolved actions for one threat',
            () => {
                const missile =
                    createMissile({
                        id:
                            'missile_1',

                        designation:
                            'M1',

                        timeToImpactMs:
                            800,

                        initialTimeToImpactMs:
                            1200,

                        identification: {
                            status:
                                THREAT_IDENTIFICATION_STATUS
                                    .UNKNOWN,
                        },
                    });

                const duplicate =
                    createThreatCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_FIRE_RED_BEAM,

                        missile.id,
                    );

                expect(() => {
                    mapCaptainCombatContextToBridgePayload({
                        stickyMineSnapshots:
                            [],

                        availableHelmCommands:
                            [],

                        enemyShips: [],

                        incomingMissiles: [
                            missile,
                        ],

                        laserThreats:
                            [],

                        availableScienceCommands:
                            [],

                        availableEngineeringCommands:
                            [],

                        availableWeaponsCommands: [
                            duplicate,
                            {
                                ...duplicate,

                                target: {
                                    ...duplicate.target,
                                },
                            },
                        ],
                    });
                }).toThrow(
                    'Captain combat context received multiple ' +
                        'red point-defense commands for threat ' +
                        missile.id,
                );
            },
        );
    },
);

type MissileIdentification =
    CombatProjectileState[
        'identification'
    ];

function createMissile({
    id,
    designation,
    timeToImpactMs,
    initialTimeToImpactMs,
    identification,
}: {
    id: string;
    designation: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

    identification:
        MissileIdentification;
}): CombatProjectileState {
    return {
        id,
        designation,

        kind:
            COMBAT_PROJECTILE_KIND
                .MISSILE,

        source: {
            kind:
                COMBAT_SOURCE_KIND
                    .ACTOR,

            actorId:
                'enemy_ship_00',
        },

        sourceWeaponId:
            'missile_launcher_00',

        target: {
            kind:
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP,
        },

        identification,

        missileId:
            MISSILE_ID.RED_00,

        timeToImpactMs,
        initialTimeToImpactMs,
    };
}

function createThreatCommand(
    commandId:
        AvailableOfficerCommand[
            'commandId'
        ],
    threatId: string,
): AvailableOfficerCommand {
    return {
        commandId,

        label:
            String(commandId),

        target: {
            kind:
                OFFICER_COMMAND_TARGET_KIND
                    .THREAT,

            threatId,
        },
    };
}
