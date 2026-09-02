import { describe, expect, it, vi } from 'vitest';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import BridgeEncounterSnapshotSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

describe('BridgeEncounterSnapshotSynchronizer', () => {
    it('maps app-facing encounter snapshots in the stable frame order', () => {
        const encounterEngine = createEncounterEngine();
        const snapshot = encounterEngine.getPresentationSnapshot();

        const emit = vi.fn();
        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            {
                emit,
            } as unknown as BridgeEventBus,
        );

        synchronizer.syncInitial(snapshot);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

                {
                    status: {
                        hull: {
                            current: 3,
                            max: 3,
                        },

                        powerCore: {
                            current: 3,
                            max: 4,

                            rechargeProgress:
                                0.05,
                        },

                        drive: {
                            shortName:
                                'DRIVE',

                            evadePowerCost:
                                2,

                            status:
                                'online',

                            integrity:
                                2,

                            maxIntegrity:
                                2,
                        },

                        shield: {
                            shortName:
                                'SHIELD GEN.',

                            powerCost: 1,

                            status:
                                'online',

                            phase:
                                'ready',

                            integrity: {
                                current: 2,
                                max: 2,
                            },

                            active: {
                                targetNode:
                                    'hull',

                                remainingDurationMs:
                                    850,

                                initialDurationMs:
                                    5000,
                            },
                        },

                        evadeAction: {
                            state:
                                'disabled_system',
                        },
                    },
                },
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_SHIELD_UPDATED,

                {
                    remainingDurationMs:
                        850,

                    initialDurationMs:
                        5000,
                },
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_SHIELDS_UPDATED,

                [
                    {
                        actorId:
                            'enemy_ship_00',

                        remainingDurationMs:
                            900,

                        initialDurationMs:
                            5000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_EVADES_UPDATED,

                [
                    {
                        actorId:
                            'enemy_ship_00',

                        phase:
                            'evading',

                        phaseElapsedMs:
                            5000,

                        evadeDurationMs:
                            30000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .DEFENSE_TURRET_THREATS_UPDATED,

                [
                    {
                        projectileId:
                            'incoming_1',

                        designation:
                            'M1',

                        timeToImpactMs:
                            800,

                        initialTimeToImpactMs:
                            1200,

                        actions: {},
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_EVADE_UPDATED,

                {
                    phase:
                        'warmup',

                    phaseElapsedMs:
                        250,
                },
            ],
        ]);

        emit.mockClear();

        synchronizer.syncCombatPresentation(snapshot);

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,
                [
                    {
                        projectileId: 'incoming_1',
                        timeToImpactMs: 800,
                    },
                ],
            ],
            [
                BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED,
                [
                    {
                        projectileId: 'outgoing_1',
                        timeToImpactMs: 600,
                        initialTimeToImpactMs: 1000,
                    },
                ],
            ],
            [
                BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED,
                [
                    {
                        mineId: 'outgoing_mine_1',
                        remainingTimeToDetonationMs: 900,
                        initialTimeToDetonationMs: 1200,
                    },
                ],
            ],
            [
                BRIDGE_EVENT.STICKY_MINES_UPDATED,
                [
                    {
                        mineId: 'incoming_mine_1',
                        remainingTimeToDetonationMs: 700,
                        initialTimeToDetonationMs: 1000,
                        isBeingCleared: true,
                        isNextClearTarget: false,
                    },
                ],
            ],
            [
                BRIDGE_EVENT
                    .PLAYER_SHIELD_UPDATED,

                {
                    remainingDurationMs:
                        850,

                    initialDurationMs:
                        5000,
                },
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_SHIELDS_UPDATED,

                [
                    {
                        actorId:
                            'enemy_ship_00',

                        remainingDurationMs:
                            900,

                        initialDurationMs:
                            5000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .ENEMY_EVADES_UPDATED,

                [
                    {
                        actorId:
                            'enemy_ship_00',

                        phase:
                            'evading',

                        phaseElapsedMs:
                            5000,

                        evadeDurationMs:
                            30000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT.BEAM_CANNON_THREATS_UPDATED,
                [
                    {
                        attackId: 'beam_cannon_attack_1',
                        timeToFireMs: 500,
                        initialTimeToFireMs: 1000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .DEFENSE_TURRET_THREATS_UPDATED,

                [
                    {
                        projectileId:
                            'incoming_1',

                        designation:
                            'M1',

                        timeToImpactMs:
                            800,

                        initialTimeToImpactMs:
                            1200,

                        actions: {},
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .PLAYER_EVADE_UPDATED,

                {
                    phase:
                        'warmup',

                    phaseElapsedMs:
                        250,
                },
            ],
        ]);
    });
});

function createEncounterEngine(): EncounterEngine {
    return {
        getPresentationSnapshot:
            vi.fn(() => {
                return {
                    navigation: {
                        kind:
                            PLAYER_SPACE_NAVIGATION_KIND
                                .ANCHORED,

                        anchorId:
                            'station_test',
                    },

                    player: {
                        hull: {
                            hull: 3,
                            maxHull: 3,
                        },

                        drive: {
                            id:
                                'drive_player_00',

                            driveId:
                                'basic_00',

                            status:
                                'online',

                            integrity:
                                2,
                        },

                        evade: {
                            phase:
                                'warmup',

                            phaseElapsedMs:
                                250,

                            cooldownRemainingMs:
                                9750,
                        },

                        powerCore: {
                            state: {
                                id:
                                    'power_core_player_00',

                                powerCoreId:
                                    'power_core_basic_00',

                                charges: 3,
                                rechargeElapsedMs:
                                    1200,
                            },

                            capacity: 4,

                            rechargeProgress:
                                0.05,
                        },

                        shieldGenerator: {
                            state: {
                                id:
                                    'shield_generator_player_00',

                                shieldGeneratorId:
                                    'shield_generator_basic_00',

                                status:
                                    'online',

                                phase:
                                    'ready',

                                phaseElapsedMs: 0,
                            },

                            cooldownDurationMs:
                                8000,

                            integrity: {
                                current: 2,
                                max: 2,
                            },
                        },

                        activeShield: {
                            sourceEmitterId:
                                'shield_generator_player_00',

                            targetNode:
                                'hull',

                            remainingDurationMs:
                                850,

                            initialDurationMs:
                                5000,
                        },

                        weapons: [],

                        officerTasks: [],

                        officerAvailability: {
                            science:
                                'available',

                            weapons:
                                'available',

                            engineer:
                                'available',

                            helm:
                                'available',
                        },
                    },

                    enemyShips: [
                        {
                            actorId:
                                'enemy_ship_00',

                            hull: {
                                current: 2,
                                max: 4,
                            },

                            drive: {
                                status:
                                    'online',
                            },

                            evade: {
                                phase:
                                    'evading',

                                phaseElapsedMs:
                                    5000,

                                cooldownRemainingMs:
                                    0,
                            },

                            evadeDurationMs:
                                30000,

                            powerCore: {
                                state: {
                                    id:
                                        'enemy_def_00',

                                    powerCoreId:
                                        'power_core_basic_00',

                                    charges: 1,
                                    rechargeElapsedMs:
                                        12000,
                                },

                                capacity: 4,

                                rechargeProgress:
                                    0.5,
                            },

                            activeShield: {
                                sourceEmitterId:
                                    'shield_generator_00',

                                remainingDurationMs:
                                    900,

                                initialDurationMs:
                                    5000,
                            },

                            weapons: [],
                        },
                    ],

                    incomingMissiles: [
                        {
                            id:
                                'incoming_1',

                            designation:
                                'M1',

                            kind:
                                'missile',

                            source: {
                                kind:
                                    'actor',

                                actorId:
                                    'enemy_ship_00',
                            },

                            sourceWeaponId:
                                'missile_launcher_enemy_00',

                            target: {
                                kind:
                                    'player_ship',
                            },


                            timeToImpactMs:
                                800,

                            initialTimeToImpactMs:
                                1200,

                        },
                    ],

                    outgoingMissiles: [
                        {
                            id:
                                'outgoing_1',

                            designation:
                                'M2',

                            kind:
                                'missile',

                            source: {
                                kind:
                                    'player_ship',
                            },

                            sourceWeaponId:
                                'missile_launcher_player_00',

                            target: {
                                kind:
                                    'actor',

                                actorId:
                                    'enemy_ship_00',
                            },


                            timeToImpactMs:
                                600,

                            initialTimeToImpactMs:
                                1000,

                        },
                    ],

                    outgoingStickyMines: [
                        {
                            id:
                                'outgoing_mine_1',

                            timeToDetonationMs:
                                900,

                            initialTimeToDetonationMs:
                                1200,
                        },
                    ],

                    stickyMineSnapshots: [
                        {
                            mine: {
                                id:
                                    'incoming_mine_1',

                                timeToDetonationMs:
                                    700,

                                initialTimeToDetonationMs:
                                    1000,
                            },

                            isBeingCleared:
                                true,

                            isNextClearTarget:
                                false,
                        },
                    ],

                    beamCannonThreats: [
                        {
                            attack: {
                                id:
                                    'beam_cannon_attack_1',

                                designation:
                                    'L1',
                            },

                            targetNode:
                                'hull',

                            timeToFireMs:
                                500,

                            initialTimeToFireMs:
                                1000,
                        },
                    ],

                    spamChannels: [
                        {
                            id:
                                'spam_channel_1',

                            sourceActorId:
                                'enemy_ship_00',

                            sourceWeaponId:
                                'spam_projector_00',

                            elapsedMs:
                                1750,

                            durationMs:
                                5000,
                        },
                    ],

                    commandsByRole: {
                        science: [],
                        helm: [],
                        weapons: [],
                        engineer: [],
                    },
                };
            }),
    } as unknown as EncounterEngine;
}
