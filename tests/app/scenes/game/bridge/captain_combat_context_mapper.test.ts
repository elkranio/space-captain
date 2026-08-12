import {
    describe,
    expect,
    it,
} from 'vitest';
import {
    COMBAT_TARGET_KIND,
} from '../../../../../src/engine/encounter/model/combat';
import {
    mapCaptainCombatContextToBridgePayload,
} from '../../../../../src/app/scenes/game/bridge/controller/captain_dashboard/BridgeCaptainCombatContextMapper';

describe(
    'BridgeCaptainCombatContextMapper',
    () => {
        it(
            'projects active laser threats into captain context',
            () => {
                expect(
                    mapCaptainCombatContextToBridgePayload({
                        enemyShips: [],

                        incomingMissiles: [],

                        laserThreats: [
                            {
                                attack: {
                                    id:
                                        'laser_attack_00',

                                    designation:
                                        'L1',

                                    sourceActorId:
                                        'ship_enemy_00',

                                    sourceWeaponId:
                                        'laser_00',

                                    target: {
                                        kind:
                                            COMBAT_TARGET_KIND
                                                .PLAYER_SHIP,
                                    },
                                },

                                timeToFireMs:
                                    6500,

                                initialTimeToFireMs:
                                    10000,
                            },
                        ],

                        stickyMineSnapshots:
                            [],

                        availableScienceCommands:
                            [],

                        availableHelmCommands:
                            [],

                        availableWeaponsCommands:
                            [],

                        availableEngineeringCommands:
                            [],
                    }),
                ).toEqual({
                    incomingMissiles: [],

                    incomingStickyMines: [],

                    incomingLasers: [
                        {
                            attackId:
                                'laser_attack_00',

                            designation:
                                'L1',

                            timeToFireMs:
                                6500,

                            initialTimeToFireMs:
                                10000,

                            actions: {},
                        },
                    ],
                });
            },
        );
    },
);
