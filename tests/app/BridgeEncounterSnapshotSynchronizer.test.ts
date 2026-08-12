import { describe, expect, it, vi } from 'vitest';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import type { GameRuntime } from '../../src/app/runtime/GameRuntime';
import BridgeEncounterSnapshotSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer';
import { BRIDGE_EVENT } from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

describe('BridgeEncounterSnapshotSynchronizer', () => {
    it('maps app-facing encounter snapshots in the stable frame order', () => {
        const encounterEngine = createEncounterEngine();

        const emit = vi.fn();
        const setPlayerShipWeaponStates =
            vi.fn();
        const setPlayerShipDefenseCapacitorState =
            vi.fn();

        const setPlayerShipShieldEmitterState =
            vi.fn();

        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            encounterEngine,
            {
                emit,
            } as unknown as BridgeEventBus,
            {
                setPlayerShipWeaponStates,
                setPlayerShipDefenseCapacitorState,
                setPlayerShipShieldEmitterState,

            } as unknown as GameRuntime,
        );

        synchronizer.syncInitial();

        expect(
            setPlayerShipDefenseCapacitorState,
        ).toHaveBeenCalledWith({
            id:
                'defense_capacitor_player_00',

            defenseCapacitorId:
                'defense_capacitor_basic_00',

            charges: 3,
            rechargeElapsedMs: 1200,
        });

        expect(
            setPlayerShipShieldEmitterState,
        ).toHaveBeenCalledWith({
            id:
                'shield_emitter_player_00',

            shieldEmitterId:
                'shield_emitter_basic_00',

            status:
                'online',

            phase:
                'ready',

            phaseElapsedMs: 0,
        });

        expect(setPlayerShipWeaponStates).toHaveBeenCalledWith([]);
        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

                {
                    status: {
                        hull: {
                            current: 3,
                            max: 3,
                        },

                        defenseCapacitor: {
                            current: 3,
                            max: 4,

                            rechargeProgress:
                                0.05,
                        },

                        drive: {
                            status:
                                'online',
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
                    .CAPTAIN_COMBAT_CONTEXT_UPDATED,

                {
                    enemyShip: {
                        actorId:
                            'enemy_ship_00',

                        hull: {
                            current: 2,
                            max: 4,
                        },

                        defenseCapacitor: {
                            current: 1,
                            max: 4,

                            rechargeProgress:
                                0.5,
                        },
                    },

                    activeSpamChannels: [
                        {
                            channelId:
                                'spam_channel_1',

                            remainingDurationMs:
                                3250,

                            initialDurationMs:
                                5000,

                            actions: {},
                        },
                    ],

                    incomingLasers: [
                        {
                            attackId:
                                'laser_attack_1',

                            designation:
                                'L1',

                            timeToFireMs:
                                500,

                            initialTimeToFireMs:
                                1000,

                            actions: {},
                        },
                    ],

                    incomingStickyMines: [
                        {
                            mineId:
                                'incoming_mine_1',

                            timeToDetonationMs:
                                700,

                            initialTimeToDetonationMs:
                                1000,

                            isBeingCleared:
                                true,

                            isNextClearTarget:
                                false,

                            actions: {},
                        },
                    ],

                    incomingMissiles: [
                        {
                            projectileId:
                                'incoming_1',

                            designation:
                                'M1',

                            timeToImpactMs:
                                800,

                            initialTimeToImpactMs:
                                1200,

                            spectralBand:
                                'red',

                            actions: {},
                        },
                    ],
                },
            ],
        ]);

        emit.mockClear();

        synchronizer.syncCombatPresentation();

        expect(emit.mock.calls).toEqual([
            [
                BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,
                [
                    {
                        projectileId: 'incoming_1',
                        timeToImpactMs: 800,
                        spectralBand: 'red',
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
                BRIDGE_EVENT.LASER_THREATS_UPDATED,
                [
                    {
                        attackId: 'laser_attack_1',
                        timeToFireMs: 500,
                        initialTimeToFireMs: 1000,
                    },
                ],
            ],

            [
                BRIDGE_EVENT
                    .CAPTAIN_COMBAT_CONTEXT_UPDATED,

                {
                    enemyShip: {
                        actorId:
                            'enemy_ship_00',

                        hull: {
                            current: 2,
                            max: 4,
                        },

                        defenseCapacitor: {
                            current: 1,
                            max: 4,

                            rechargeProgress:
                                0.5,
                        },
                    },

                    activeSpamChannels: [
                        {
                            channelId:
                                'spam_channel_1',

                            remainingDurationMs:
                                3250,

                            initialDurationMs:
                                5000,

                            actions: {},
                        },
                    ],

                    incomingLasers: [
                        {
                            attackId:
                                'laser_attack_1',

                            designation:
                                'L1',

                            timeToFireMs:
                                500,

                            initialTimeToFireMs:
                                1000,

                            actions: {},
                        },
                    ],

                    incomingStickyMines: [
                        {
                            mineId:
                                'incoming_mine_1',

                            timeToDetonationMs:
                                700,

                            initialTimeToDetonationMs:
                                1000,

                            isBeingCleared:
                                true,

                            isNextClearTarget:
                                false,

                            actions: {},
                        },
                    ],

                    incomingMissiles: [
                        {
                            projectileId:
                                'incoming_1',

                            designation:
                                'M1',

                            timeToImpactMs:
                                800,

                            initialTimeToImpactMs:
                                1200,

                            spectralBand:
                                'red',

                            actions: {},
                        },
                    ],
                },
            ],
        ]);
    });
});

function createEncounterEngine(): EncounterEngine {
    return {
        getCombatPresentationSnapshot:
            vi.fn(() => {
                return {
                    player: {
                        hull: {
                            hull: 3,
                            maxHull: 3,
                        },

                        drive: {
                            id:
                                'drive_player_00',

                            driveId:
                                'drive_basic_00',

                            status:
                                'online',
                        },

                        defenseCapacitor: {
                            state: {
                                id:
                                    'defense_capacitor_player_00',

                                defenseCapacitorId:
                                    'defense_capacitor_basic_00',

                                charges: 3,
                                rechargeElapsedMs:
                                    1200,
                            },

                            capacity: 4,

                            rechargeProgress:
                                0.05,
                        },

                        shieldEmitter: {
                            id:
                                'shield_emitter_player_00',

                            shieldEmitterId:
                                'shield_emitter_basic_00',

                            status:
                                'online',

                            phase:
                                'ready',

                            phaseElapsedMs: 0,
                        },

                        activeShield: {
                            sourceEmitterId:
                                'shield_emitter_player_00',

                            remainingDurationMs:
                                850,

                            initialDurationMs:
                                5000,
                        },

                        weapons: [],

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

                            defenseCapacitor: {
                                state: {
                                    id:
                                        'enemy_def_00',

                                    defenseCapacitorId:
                                        'defense_capacitor_basic_00',

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
                                    'shield_emitter_00',

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

                            timeToImpactMs:
                                800,

                            initialTimeToImpactMs:
                                1200,

                            identification: {
                                status:
                                    'identified',

                                spectralBand:
                                    'red',
                            },
                        },
                    ],

                    outgoingMissiles: [
                        {
                            id:
                                'outgoing_1',

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

                    laserThreats: [
                        {
                            attack: {
                                id:
                                    'laser_attack_1',

                                designation:
                                    'L1',
                            },

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
