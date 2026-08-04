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
        const setPlayerShipWeaponStates = vi.fn();

        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            encounterEngine,
            {
                emit,
            } as unknown as BridgeEventBus,
            {
                setPlayerShipWeaponStates,
            } as unknown as GameRuntime,
        );

        synchronizer.syncInitial();

        expect(setPlayerShipWeaponStates).toHaveBeenCalledWith([]);
        expect(emit.mock.calls).toEqual([
            [BRIDGE_EVENT.PLAYER_WEAPONS_STATUS_UPDATED, {}],
            [
                BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED,
                {
                    actorId: 'enemy_1',
                    hull: {
                        current: 2,
                        max: 3,
                    },
                    drive: {
                        status: 'online',
                    },
                    shieldGenerator: {
                        current: 1,
                        max: 2,
                    },
                    weapons: [
                        {
                            id: 'enemy_laser',
                            kind: 'laser',
                            phase: 'charging',
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
                BRIDGE_EVENT.LASER_THREATS_UPDATED,
                [
                    {
                        attackId: 'laser_attack_1',
                        timeToFireMs: 500,
                        initialTimeToFireMs: 1000,
                        targetZone: 'left',
                    },
                ],
            ],
            [
                BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
                {
                    zone: 'left',
                    remainingDurationMs: 750,
                    initialDurationMs: 1000,
                },
            ],
            [
                BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED,
                [
                    {
                        actorId: 'enemy_1',
                        zone: 'right',
                        remainingDurationMs: 600,
                        initialDurationMs: 1000,
                    },
                ],
            ],
            [
                BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED,
                {
                    actorId: 'enemy_1',
                    hull: {
                        current: 2,
                        max: 3,
                    },
                    drive: {
                        status: 'online',
                    },
                    shieldGenerator: {
                        current: 1,
                        max: 2,
                    },
                    weapons: [
                        {
                            id: 'enemy_laser',
                            kind: 'laser',
                            phase: 'charging',
                        },
                    ],
                },
            ],
        ]);
    });
});

function createEncounterEngine(): EncounterEngine {
    return {
        getPlayerWeaponStates: vi.fn(() => {
            return [];
        }),

        getEnemyShipTelemetrySnapshots: vi.fn(() => {
            return [
                {
                    actorId: 'enemy_1',
                    hull: {
                        current: 2,
                        max: 3,
                    },
                    drive: {
                        status: 'online',
                    },
                    shieldGenerator: {
                        current: 1,
                        max: 2,
                    },
                    weapons: [
                        {
                            id: 'enemy_laser',
                            kind: 'laser',
                            phase: 'charging',
                        },
                    ],
                },
            ];
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
                        identification: {
                            status: 'identified',
                            targetZone: 'left',
                        },
                    },
                    timeToFireMs: 500,
                    initialTimeToFireMs: 1000,
                },
            ];
        }),

        getActiveShieldState: vi.fn(() => {
            return {
                zone: 'left',
                elapsedMs: 250,
                durationMs: 1000,
            };
        }),

        getEnemyShieldSnapshots: vi.fn(() => {
            return [
                {
                    actorId: 'enemy_1',
                    zone: 'right',
                    elapsedMs: 400,
                    durationMs: 1000,
                },
            ];
        }),
    } as unknown as EncounterEngine;
}
