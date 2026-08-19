import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../src/engine/defs/officer';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
    type AvailableOfficerCommand,
} from '../../src/engine/encounter/model/command';
import {
    createPowerCorePresentationSnapshot,
    type MissilePresentationSnapshot,
} from '../../src/engine/encounter/snapshots/combat_presentation_snapshot';
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

                        identificationStatus:
                            MISSILE_SIGNATURE_INTEL_STATUS
                                .CONFIRMED,
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

                        identificationStatus:
                            MISSILE_SIGNATURE_INTEL_STATUS
                                .UNKNOWN,
                    });

                expect(
                    mapCaptainCombatContextToBridgePayload({
                        spamChannels:
                            [],

                        stickyMineSnapshots:
                            [],

                        enemyShips: [],

                        incomingMissiles: [
                            far,
                            near,
                        ],

                        beamCannonThreats:
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
                                    .WEAPONS_INTERCEPT_MISSILE,

                                far.id,
                            ),

                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .WEAPONS_INTERCEPT_MISSILE,

                                near.id,
                            ),
                        ],
                    }),
                ).toEqual({
                    activeSpamChannels:
                        [],

                    incomingStickyMines:
                        [],

                    incomingBeamCannons:
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

                            identificationStatus:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .CONFIRMED,

                            actions: {
                                interceptMissile: {
                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .WEAPONS_INTERCEPT_MISSILE,

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

                            identificationStatus:
                                MISSILE_SIGNATURE_INTEL_STATUS
                                    .UNKNOWN,

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

                                interceptMissile: {
                                    role:
                                        OFFICER_ROLE
                                            .WEAPONS,

                                    commandId:
                                        ENCOUNTER_OFFICER_COMMAND_ID
                                            .WEAPONS_INTERCEPT_MISSILE,

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
            'maps current enemy hull and power core',
            () => {
                expect(
                    mapCaptainCombatContextToBridgePayload({
                        spamChannels:
                            [],

                        stickyMineSnapshots:
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

                                evade: {
                                    phase:
                                        'ready',

                                    phaseElapsedMs:
                                        0,

                                    cooldownRemainingMs:
                                        0,
                                },

                                evadeDurationMs:
                                    30000,

                                powerCore:
                                    createPowerCorePresentationSnapshot({
                                        id:
                                            'enemy_def_00',

                                        powerCoreId:
                                            'power_core_basic_00',

                                        charges: 2,
                                        rechargeElapsedMs:
                                            6000,
                                    }),

                                weapons: [],
                            },
                        ],

                        incomingMissiles:
                            [],

                        beamCannonThreats:
                            [],

                        availableScienceCommands:
                            [],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands:
                            [],
                    }),
                ).toEqual({
                    activeSpamChannels:
                        [],

                    incomingStickyMines:
                        [],

                    incomingBeamCannons:
                        [],

                    enemyShip: {
                        actorId:
                            'enemy_ship_00',

                        hull: {
                            current: 3,
                            max: 4,
                        },

                        powerCore: {
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
            'maps the resolved untargeted Engineer shield command onto beamCannon rows',
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
                        spamChannels:
                            [],

                        stickyMineSnapshots:
                            [],

                        enemyShips: [],
                        incomingMissiles: [],

                        beamCannonThreats: [
                            {
                                attack: {
                                    id:
                                        'beam_cannon_attack_1',

                                    designation:
                                        'L1',

                                    sourceActorId:
                                        'enemy_ship_00',

                                    sourceWeaponId:
                                        'beam_cannon_enemy_00',

                                    target: {
                                        kind:
                                            COMBAT_TARGET_KIND
                                                .PLAYER_SHIP,
                                    },
                                },

                                targetIntel: {
                                    status: 'unknown',
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
                    activeSpamChannels:
                        [],

                    incomingStickyMines:
                        [],

                    incomingMissiles: [],

                    incomingBeamCannons: [
                        {
                            attackId:
                                'beam_cannon_attack_1',

                            designation:
                                'L1',

                            targetIntel: {
                                status:
                                    'unknown',
                            },

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
            'maps attached mines nearest-first with exact Engineer clear commands per mine',
            () => {
                const clearLater = createThreatCommand(
                    ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,
                    'mine_later',
                );
                const clearNext = createThreatCommand(
                    ENCOUNTER_OFFICER_COMMAND_ID.CLEAR_STICKY_MINE,
                    'mine_next',
                );

                const payload =
                    mapCaptainCombatContextToBridgePayload({
                        enemyShips: [],
                        incomingMissiles: [],
                        beamCannonThreats: [],

                        spamChannels:
                            [],

                        stickyMineSnapshots: [
                            {
                                mine: {
                                    id:
                                        'mine_later',


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

                        availableScienceCommands:
                            [],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands: [
                            clearLater,
                            clearNext,
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
                            engineerClear: {
                                role:
                                    OFFICER_ROLE.ENGINEER,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .THREAT,

                                    threatId:
                                        'mine_next',
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

                        actions: {
                            engineerClear: {
                                role:
                                    OFFICER_ROLE.ENGINEER,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .CLEAR_STICKY_MINE,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .THREAT,

                                    threatId:
                                        'mine_later',
                                },
                            },
                        },
                    },
                ]);
            },
        );

        it(
            'maps active spam channel with remaining duration and exact Science purge action',
            () => {
                const channelId =
                    'spam_channel_1';

                const payload =
                    mapCaptainCombatContextToBridgePayload({
                        enemyShips: [],
                        incomingMissiles: [],
                        beamCannonThreats: [],
                        stickyMineSnapshots: [],

                        spamChannels: [
                            {
                                id:
                                    channelId,

                                sourceActorId:
                                    'enemy_ship_00',

                                sourceWeaponId:
                                    'spam_projector_00',

                                elapsedMs:
                                    1250,

                                durationMs:
                                    5000,
                            },
                        ],

                        availableScienceCommands: [
                            createThreatCommand(
                                ENCOUNTER_OFFICER_COMMAND_ID
                                    .SCIENCE_PURGE_SPAM,

                                channelId,
                            ),
                        ],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands:
                            [],
                    });

                expect(
                    payload.activeSpamChannels,
                ).toEqual([
                    {
                        channelId,

                        remainingDurationMs:
                            3750,

                        initialDurationMs:
                            5000,

                        actions: {
                            purgeSpam: {
                                role:
                                    OFFICER_ROLE
                                        .SCIENCE,

                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .SCIENCE_PURGE_SPAM,

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .THREAT,

                                    threatId:
                                        channelId,
                                },
                            },
                        },
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

                        identificationStatus:
                            MISSILE_SIGNATURE_INTEL_STATUS
                                .UNKNOWN,
                    });

                const duplicate =
                    createThreatCommand(
                        ENCOUNTER_OFFICER_COMMAND_ID
                            .WEAPONS_INTERCEPT_MISSILE,

                        missile.id,
                    );

                expect(() => {
                    mapCaptainCombatContextToBridgePayload({
                        spamChannels:
                            [],

                        stickyMineSnapshots:
                            [],

                        enemyShips: [],

                        incomingMissiles: [
                            missile,
                        ],

                        beamCannonThreats:
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
                        'defense-turret intercept commands for threat ' +
                        missile.id,
                );
            },
        );
    },
);

function createMissile({
    id,
    designation,
    timeToImpactMs,
    initialTimeToImpactMs,
    identificationStatus,
}: {
    id: string;
    designation: string;

    timeToImpactMs: number;
    initialTimeToImpactMs: number;

    identificationStatus:
        MissilePresentationSnapshot[
            'identificationStatus'
        ];
}): MissilePresentationSnapshot {
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


        timeToImpactMs,
        initialTimeToImpactMs,

        identificationStatus,
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
