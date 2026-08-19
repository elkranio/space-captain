import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    OFFICER_ROLE,
} from '../../../../../src/engine/defs/officer';
import {
    COMBAT_TARGET_KIND,
} from '../../../../../src/engine/encounter/model/combat';
import {
    ENCOUNTER_OFFICER_COMMAND_ID,
    OFFICER_COMMAND_TARGET_KIND,
} from '../../../../../src/engine/encounter/model/command';
import {
    mapCaptainCombatContextToBridgePayload,
} from '../../../../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper';

describe(
    'BridgeCaptainCombatContextMapper',
    () => {
        it(
            'projects active beamCannon threats into captain context',
            () => {
                expect(
                    mapCaptainCombatContextToBridgePayload({
                        enemyShips: [],

                        incomingMissiles: [],

                        beamCannonThreats: [
                            {
                                attack: {
                                    id:
                                        'beam_cannon_attack_00',

                                    designation:
                                        'L1',

                                    sourceActorId:
                                        'ship_enemy_00',

                                    sourceWeaponId:
                                        'beam_cannon_00',

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
                                    6500,

                                initialTimeToFireMs:
                                    10000,
                            },
                        ],

                        spamChannels:
                            [],

                        stickyMineSnapshots:
                            [],

                        availableScienceCommands: [
                            {
                                commandId:
                                    ENCOUNTER_OFFICER_COMMAND_ID
                                        .SCIENCE_IDENTIFY_THREAT,

                                label:
                                    'BEAM L1',

                                target: {
                                    kind:
                                        OFFICER_COMMAND_TARGET_KIND
                                            .THREAT,

                                    threatId:
                                        'beam_cannon_attack_00',
                                },

                                targetLabel:
                                    'IDENTIFY THREAT',
                            },
                        ],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands:
                            [],
                    }),
                ).toEqual({
                    incomingMissiles: [],

                    activeSpamChannels:
                        [],

                    incomingStickyMines: [],

                    incomingBeamCannons: [
                        {
                            attackId:
                                'beam_cannon_attack_00',

                            designation:
                                'L1',

                            targetIntel: {
                                status:
                                    'unknown',
                            },

                            timeToFireMs:
                                6500,

                            initialTimeToFireMs:
                                10000,

                            actions: {
                                trackTarget: {
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
                                            'beam_cannon_attack_00',
                                    },
                                },
                            },
                        },
                    ],
                });
            },
        );
    },
);
