import { describe, expect, it, vi } from 'vitest';
import {
    PLAYER_SPACE_NAVIGATION_KIND,
} from '../../src/engine/defs/player_location';
import type EncounterEngine from '../../src/engine/encounter/EncounterEngine';
import BridgeEncounterSnapshotSynchronizer from '../../src/app/scenes/game/bridge/controller/encounter/snapshots/BridgeEncounterSnapshotSynchronizer';
import {
    BRIDGE_EVENT,
    BRIDGE_OFFICER_STATION_STATE,
} from '../../src/app/scenes/game/bridge/events/bridge_event';
import type BridgeEventBus from '../../src/app/scenes/game/bridge/events/BridgeEventBus';

describe('BridgeEncounterSnapshotSynchronizer', () => {
    it('maps app-facing encounter snapshots in the stable frame order', () => {
        const encounterEngine = createEncounterEngine();
        const snapshot = encounterEngine.getPresentationSnapshot();

        snapshot.player.officerTasks = [
            {
                id: 'scientist_task_1',
                kind: 'scientist_fire_spam',
                role: 'scientist',
                sourceCommandId: 'scientist_fire_spam',
                label: 'SPAM WARM-UP',
                durationMs: 3000,
                elapsedMs: 1000,
                canBeCancelledByPlayer: true,
                weaponId: 'spam_projector_player_00',
                targetActorId: 'enemy_ship_00',
            },
        ];
        snapshot.player.officerAvailability.scientist = 'busy';

        const emit = vi.fn();
        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            {
                emit,
            } as unknown as BridgeEventBus,
            'player_00',
        );

        synchronizer.syncInitial(snapshot);

        expect(emit.mock.calls).toMatchObject([
            [
                BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

                {
                    status: {
                        hull: {
                            current: 3,
                            max: 3,
                        },

                        powerCore: {
                            id:
                                'power_core_player_00',

                            definitionId:
                                'power_core_basic_00',

                            iconId:
                                'power_core',

                            slotId:
                                'power_core',

                            current: 3,
                            max: 4,

                            integrity: {
                                current: 2,
                                max: 2,
                            },

                            rechargeProgress:
                                0.05,
                        },

                        drive: {
                            shortName:
                                'DRIVE',

                            evadePowerCost:
                                2,

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
                    .OFFICER_STATIONS_UPDATED,

                {
                    scientist:
                        BRIDGE_OFFICER_STATION_STATE
                            .ACTIVE,

                    pilot:
                        BRIDGE_OFFICER_STATION_STATE
                            .IDLE,

                    gunner:
                        BRIDGE_OFFICER_STATION_STATE
                            .IDLE,

                    engineer:
                        BRIDGE_OFFICER_STATION_STATE
                            .IDLE,
                },
            ],

            [
                BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,

                {
                    actorId:
                        'enemy_ship_00',

                    displayName:
                        'Enemy test ship',

                    hull: {
                        current: 2,
                        max: 4,
                    },

                    powerCore: {
                        current: 1,
                        max: 4,

                        rechargeProgress:
                            0.5,
                    },

                    equipment: [
                        {
                            slotId: 'drive',
                            targetLocked: false,
                            id:
                                'enemy_drive_00',

                            shortName:
                                'DRIVE',

                            sprite: {
                                atlasKey:
                                    'atlas',

                                frameKey:
                                    'equipment/icons/drive',
                            },

                            integrity: {
                                current: 2,
                                max: 2,
                            },

                            broken:
                                false,
                        },
                        {
                            slotId:
                                'power_core',

                            targetLocked:
                                false,

                            id:
                                'enemy_def_00',

                            shortName:
                                'POWER CORE',

                            sprite: {
                                atlasKey:
                                    'atlas',

                                frameKey:
                                    'equipment/icons/power_core',
                            },

                            integrity: {
                                current: 1,
                                max: 2,
                            },

                            broken:
                                false,
                        },
                    ],
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

        expect(emit.mock.calls).toMatchObject([
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

            [
                BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,

                {
                    actorId:
                        'enemy_ship_00',

                    displayName:
                        'Enemy test ship',

                    hull: {
                        current: 2,
                        max: 4,
                    },

                    powerCore: {
                        current: 1,
                        max: 4,

                        rechargeProgress:
                            0.5,
                    },

                    equipment: [
                        {
                            slotId: 'drive',
                            targetLocked: false,
                            id:
                                'enemy_drive_00',

                            shortName:
                                'DRIVE',

                            sprite: {
                                atlasKey:
                                    'atlas',

                                frameKey:
                                    'equipment/icons/drive',
                            },

                            integrity: {
                                current: 2,
                                max: 2,
                            },

                            broken:
                                false,
                        },
                        {
                            slotId:
                                'power_core',

                            targetLocked:
                                false,

                            id:
                                'enemy_def_00',

                            shortName:
                                'POWER CORE',

                            sprite: {
                                atlasKey:
                                    'atlas',

                                frameKey:
                                    'equipment/icons/power_core',
                            },

                            integrity: {
                                current: 1,
                                max: 2,
                            },

                            broken:
                                false,
                        },
                    ],
                },
            ],

        ]);
    });

    it('maps Scientist neural recovery to the incapacitated portrait state', () => {
        const snapshot = createEncounterEngine().getPresentationSnapshot();

        snapshot.player.officerStatuses = [
            {
                kind: 'neural_recovery',
                role: 'scientist',
                durationMs: 3000,
                elapsedMs: 1000,
            },
        ];

        const emit = vi.fn();
        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            {
                emit,
            } as unknown as BridgeEventBus,
            'player_00',
        );

        synchronizer.syncOfficerStations(snapshot);

        expect(emit).toHaveBeenCalledWith(
            BRIDGE_EVENT.OFFICER_STATIONS_UPDATED,
            {
                scientist: BRIDGE_OFFICER_STATION_STATE.INCAPACITATED,
                pilot: BRIDGE_OFFICER_STATION_STATE.IDLE,
                gunner: BRIDGE_OFFICER_STATION_STATE.IDLE,
                engineer: BRIDGE_OFFICER_STATION_STATE.IDLE,
            },
        );
    });

    it('allows player dashboard snapshots without an installed Power Core', () => {
        const snapshot = createEncounterEngine().getPresentationSnapshot();
        delete snapshot.player.powerCore;
        snapshot.player.mounts = snapshot.player.mounts.filter((mount) => {
            return mount.slotId !== 'power_core';
        });

        const emit = vi.fn();
        const synchronizer = new BridgeEncounterSnapshotSynchronizer(
            {
                emit,
            } as unknown as BridgeEventBus,
            'player_00',
        );

        expect(() => {
            synchronizer.syncPlayerShipDashboard(snapshot);
        }).not.toThrow();

        const payload = emit.mock.calls[0]?.[1];

        expect(payload?.status).not.toHaveProperty('powerCore');
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

                        mounts: [
                            {
                                slotId: 'drive',
                                equipmentId: 'drive_player_00',
                            },
                            {
                                slotId: 'power_core',
                                equipmentId: 'power_core_player_00',
                            },
                            {
                                slotId: 'defense_01',
                                equipmentId: 'shield_generator_player_00',
                            },
                        ],

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

                            integrity: {
                                current: 2,
                                max: 2,
                            },

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
                        officerStatuses: [],

                        officerAvailability: {
                            scientist:
                                'available',

                            gunner:
                                'available',

                            engineer:
                                'available',

                            pilot:
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

                    enemyShipDashboards: [
                        {
                            actorId:
                                'enemy_ship_00',

                            displayName:
                                'Enemy test ship',

                            chassisId:
                                'generic_00',

                            hull: {
                                current: 2,
                                max: 4,
                            },

                            mounts: [
                                {
                                    slotId:
                                        'drive',

                                    equipmentId:
                                        'enemy_drive_00',
                                },
                                {
                                    slotId:
                                        'power_core',

                                    equipmentId:
                                        'enemy_def_00',
                                },
                            ],

                            powerCore: {
                                id: 'enemy_def_00',
                                definitionId: 'power_core_basic_00',
                                charges: 1,
                                capacity: 4,
                                rechargeProgress: 0.5,
                                integrity: {
                                    current: 1,
                                    max: 2,
                                },
                            },

                            drive: {
                                id:
                                    'enemy_drive_00',

                                definitionId:
                                    'basic_00',

                                integrity: {
                                    current: 2,
                                    max: 2,
                                },
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

                    playerThreatDecisionTimings: {
                        missile: {
                            interceptMinRemainingMs:
                                3000,
                        },

                        beam: {
                            shieldWindow: null,
                        },

                        stickyMine: {
                            clearMinRemainingMs: null,
                        },
                    },

                    commandsByRole: {
                        scientist: [],
                        pilot: [],
                        gunner: [],
                        engineer: [],
                    },
                };
            }),
    } as unknown as EncounterEngine;
}
