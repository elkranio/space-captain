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

        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            encounterEngine,
            {
                emit,
            } as unknown as BridgeEventBus,
            {
                setPlayerShipWeaponStates,
                setPlayerShipDefenseCapacitorState,

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
                BRIDGE_EVENT.LASER_THREATS_UPDATED,
                [
                    {
                        attackId: 'laser_attack_1',
                        timeToFireMs: 500,
                        initialTimeToFireMs: 1000,
                    },
                ],
            ],
        ]);
    });
});

function createEncounterEngine(): EncounterEngine {
    return {
        getDefenseCapacitorState:
            vi.fn(() => {
                return {
                    id:
                        'defense_capacitor_player_00',

                    defenseCapacitorId:
                        'defense_capacitor_basic_00',

                    charges: 3,
                    rechargeElapsedMs: 1200,
                };
            }),

        getPlayerWeaponStates: vi.fn(() => {
            return [];
        }),

        getPlayerHullState:
            vi.fn(() => {
                return {
                    hull: 3,
                    maxHull: 3,
                };
            }),

        getDriveState:
            vi.fn(() => {
                return {
                    id:
                        'drive_player_00',

                    driveId:
                        'drive_basic_00',

                    status:
                        'online',
                };
            }),

        getAvailableCommands: vi.fn(() => {
            return [];
        }),

        getOfficerAvailabilityStates: vi.fn(() => {
            return {
                science: 'available',
                weapons: 'available',
                engineer: 'available',
                helm: 'available',
            };
        }),

        getIncomingMissileProjectiles: vi.fn(() => {
            return [
                {
                    id: 'incoming_1',
                    timeToImpactMs: 800,
                    identification: {
                        status: 'identified',
                        spectralBand: 'red',
                    },
                },
            ];
        }),

        getOutgoingMissileProjectiles: vi.fn(() => {
            return [
                {
                    id: 'outgoing_1',
                    timeToImpactMs: 600,
                    initialTimeToImpactMs: 1000,
                },
            ];
        }),

        getOutgoingStickyMines: vi.fn(() => {
            return [
                {
                    id: 'outgoing_mine_1',
                    timeToDetonationMs: 900,
                    initialTimeToDetonationMs: 1200,
                },
            ];
        }),

        getStickyMineSnapshots: vi.fn(() => {
            return [
                {
                    mine: {
                        id: 'incoming_mine_1',
                        timeToDetonationMs: 700,
                        initialTimeToDetonationMs: 1000,
                    },
                    isBeingCleared: true,
                    isNextClearTarget: false,
                },
            ];
        }),

        getLaserThreatSnapshots: vi.fn(() => {
            return [
                {
                    attack: {
                        id: 'laser_attack_1',
                    },
                    timeToFireMs: 500,
                    initialTimeToFireMs: 1000,
                },
            ];
        }),

    } as unknown as EncounterEngine;
}
