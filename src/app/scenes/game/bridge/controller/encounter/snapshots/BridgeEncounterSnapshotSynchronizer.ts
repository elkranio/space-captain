import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import type {
    EncounterPresentationSnapshot,
} from '../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { mapCaptainCombatContextToBridgePayload } from '../../captain_dashboard/BridgeCaptainCombatContextMapper';
import { mapPlayerShipToBridgeDashboardPayload } from '../../captain_dashboard/BridgePlayerShipDashboardMapper';
import { mapPlayerWeaponsToBridgeStatusPayload } from '../../player_weapon_status/BridgePlayerWeaponStatusMapper';

// App-side transport for continuously changing encounter read models.
//
// Один EncounterPresentationSnapshot представляет одну фотографию combat frame.
// Engine остаётся единственным владельцем mutable state; synchronizer только
// раскладывает уже detached read-model по GameRuntime / bridge events.
//
// Публичные no-arg методы сохранены для focused callers/tests.
// Frame orchestration передаёт один и тот же snapshot в dashboard и combat
// presentation, чтобы app не пересобирал один кадр несколькими getters.
export default class BridgeEncounterSnapshotSynchronizer {
    constructor(
        private readonly encounterEngine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
        private readonly gameRuntime: GameRuntime,
    ) {}

    public syncInitial(): void {
        const snapshot =
            this.encounterEngine
                .getPresentationSnapshot();

        this.syncPlayerShipDashboard(
            snapshot,
        );
        this.syncPlayerShield(
            snapshot,
        );
        this.syncEnemyShields(
            snapshot,
        );
        this.syncCaptainCombatContext(
            snapshot,
        );
    }

    public syncCombatPresentation(
        snapshot =
            this.encounterEngine
                .getPresentationSnapshot(),
    ): void {
        this.syncIncomingMissiles(
            snapshot,
        );
        this.syncOutgoingMissiles(
            snapshot,
        );
        this.syncOutgoingStickyMines(
            snapshot,
        );
        this.syncStickyMines(
            snapshot,
        );
        this.syncPlayerShield(
            snapshot,
        );
        this.syncEnemyShields(
            snapshot,
        );
        this.syncLaserThreats(
            snapshot,
        );
        this.syncCaptainCombatContext(
            snapshot,
        );
    }

    public syncPlayerShipDashboard(
        snapshot =
            this.encounterEngine
                .getPresentationSnapshot(),
    ): void {
        const powerCore =
            snapshot.player
                .powerCore;

        if (!powerCore) {
            throw new Error(
                'Bridge player ship requires a power core',
            );
        }

        this.gameRuntime
            .setPlayerShipPowerCoreState(
                powerCore
                    .state,
            );

        const shieldGenerator =
            snapshot.player
                .shieldGenerator;

        if (!shieldGenerator) {
            throw new Error(
                'Bridge player ship requires a shield generator',
            );
        }

        this.gameRuntime
            .setPlayerShipShieldGeneratorState(
                shieldGenerator,
            );

        this.gameRuntime
            .setPlayerShipWeaponStates(
                snapshot.player
                    .weapons
                    .map(
                        ({ state }) =>
                            state,
                    ),
            );

        const weaponStatus =
            mapPlayerWeaponsToBridgeStatusPayload(
                snapshot.player
                    .weapons,
            );

        const officerAvailability =
            snapshot.player
                .officerAvailability;

        this.eventBus.emit(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            mapPlayerShipToBridgeDashboardPayload({
                weapons:
                    weaponStatus,

                availableWeaponsCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .WEAPONS
                        ],

                weaponsOfficerAvailability:
                    officerAvailability[
                        OFFICER_ROLE.WEAPONS
                    ],

                availableScienceCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .SCIENCE
                        ],

                scienceOfficerAvailability:
                    officerAvailability[
                        OFFICER_ROLE.SCIENCE
                    ],

                playerStatus: {
                    hull:
                        snapshot.player
                            .hull,

                    drive:
                        snapshot.player
                            .drive,

                    powerCore,

                    ...(snapshot
                        .player
                        .defenseTurret
                        ? {
                              defenseTurret:
                                  snapshot
                                      .player
                                      .defenseTurret,
                          }
                        : {}),
                },
            }),
        );
    }

    private syncCaptainCombatContext(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .CAPTAIN_COMBAT_CONTEXT_UPDATED,

            mapCaptainCombatContextToBridgePayload({
                enemyShips:
                    snapshot.enemyShips,

                incomingMissiles:
                    snapshot.incomingMissiles,

                laserThreats:
                    snapshot.laserThreats,

                stickyMineSnapshots:
                    snapshot
                        .stickyMineSnapshots,

                spamChannels:
                    snapshot.spamChannels,

                availableScienceCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .SCIENCE
                        ],

                availableHelmCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .HELM
                        ],

                availableWeaponsCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .WEAPONS
                        ],

                availableEngineeringCommands:
                    snapshot
                        .commandsByRole[
                            OFFICER_ROLE
                                .ENGINEER
                        ],
            }),
        );
    }

    private syncPlayerShield(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        const shield =
            snapshot.player
                .activeShield;

        this.eventBus.emit(
            BRIDGE_EVENT
                .PLAYER_SHIELD_UPDATED,

            shield
                ? {
                      remainingDurationMs:
                          shield
                              .remainingDurationMs,

                      initialDurationMs:
                          shield
                              .initialDurationMs,
                  }
                : null,
        );
    }

    private syncEnemyShields(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        const shields: Array<{
            actorId: string;
            remainingDurationMs: number;
            initialDurationMs: number;
        }> = [];

        for (
            const enemy of
            snapshot.enemyShips
        ) {
            const shield =
                enemy.activeShield;

            if (!shield) {
                continue;
            }

            shields.push({
                actorId:
                    enemy.actorId,

                remainingDurationMs:
                    shield
                        .remainingDurationMs,

                initialDurationMs:
                    shield
                        .initialDurationMs,
            });
        }

        this.eventBus.emit(
            BRIDGE_EVENT
                .ENEMY_SHIELDS_UPDATED,

            shields,
        );
    }

    public syncLaserThreats(
        snapshot =
            this.encounterEngine
                .getPresentationSnapshot(),
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .LASER_THREATS_UPDATED,

            snapshot
                .laserThreats
                .map((laserThreat) => {
                    return {
                        attackId:
                            laserThreat
                                .attack.id,

                        timeToFireMs:
                            laserThreat
                                .timeToFireMs,

                        initialTimeToFireMs:
                            laserThreat
                                .initialTimeToFireMs,
                    };
                }),
        );
    }

    private syncIncomingMissiles(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .INCOMING_MISSILES_UPDATED,

            snapshot
                .incomingMissiles
                .map((projectile) => {
                    return {
                        projectileId:
                            projectile.id,

                        timeToImpactMs:
                            projectile
                                .timeToImpactMs,

                        identificationStatus:
                            projectile
                                .identificationStatus,
                    };
                }),
        );
    }

    private syncOutgoingMissiles(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .OUTGOING_MISSILES_UPDATED,

            snapshot
                .outgoingMissiles
                .map((projectile) => {
                    return {
                        projectileId:
                            projectile.id,

                        timeToImpactMs:
                            projectile
                                .timeToImpactMs,

                        initialTimeToImpactMs:
                            projectile
                                .initialTimeToImpactMs,
                    };
                }),
        );
    }

    private syncOutgoingStickyMines(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .OUTGOING_STICKY_MINES_UPDATED,

            snapshot
                .outgoingStickyMines
                .map((mine) => {
                    return {
                        mineId:
                            mine.id,

                        remainingTimeToDetonationMs:
                            mine
                                .timeToDetonationMs,

                        initialTimeToDetonationMs:
                            mine
                                .initialTimeToDetonationMs,
                    };
                }),
        );
    }

    private syncStickyMines(
        snapshot:
            EncounterPresentationSnapshot,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .STICKY_MINES_UPDATED,

            snapshot
                .stickyMineSnapshots
                .map((mineSnapshot) => {
                    return {
                        mineId:
                            mineSnapshot
                                .mine.id,

                        remainingTimeToDetonationMs:
                            mineSnapshot
                                .mine
                                .timeToDetonationMs,

                        initialTimeToDetonationMs:
                            mineSnapshot
                                .mine
                                .initialTimeToDetonationMs,

                        isBeingCleared:
                            mineSnapshot
                                .isBeingCleared,

                        isNextClearTarget:
                            mineSnapshot
                                .isNextClearTarget,
                    };
                }),
        );
    }
}
