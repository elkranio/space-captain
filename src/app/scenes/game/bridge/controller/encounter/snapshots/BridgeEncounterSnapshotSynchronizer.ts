import { OFFICER_ROLE } from '../../../../../../../engine/defs/officer';
import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import { THREAT_IDENTIFICATION_STATUS } from '../../../../../../../engine/encounter/model/combat';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { mapCaptainCombatContextToBridgePayload } from '../../captain_dashboard/BridgeCaptainCombatContextMapper';
import { mapPlayerShipToBridgeDashboardPayload } from '../../captain_dashboard/BridgePlayerShipDashboardMapper';
import { mapPlayerWeaponsToBridgeStatusPayload } from '../../player_weapon_status/BridgePlayerWeaponStatusMapper';

// App-side transport for continuously changing encounter read models.
//
// The engine remains the authoritative owner of combat state.
// This synchronizer only reads detached engine snapshots, maps them to
// bridge payloads and delivers them to GameRuntime / bridge views.
// Navigation stays in BridgeEncounterController because it is synchronized
// at explicit lifecycle boundaries rather than on every frame.
export default class BridgeEncounterSnapshotSynchronizer {
    constructor(
        private readonly encounterEngine: EncounterEngine,
        private readonly eventBus: BridgeEventBus,
        private readonly gameRuntime: GameRuntime,
    ) {}

    public syncInitial(): void {
        this.syncPlayerShipDashboard();
        this.syncPlayerShield();
        this.syncCaptainCombatContext();
    }

    public syncCombatPresentation(): void {
        this.syncIncomingMissiles();
        this.syncOutgoingMissiles();
        this.syncOutgoingStickyMines();
        this.syncStickyMines();
        this.syncPlayerShield();
        this.syncLaserThreats();
        this.syncCaptainCombatContext();
    }

    public syncPlayerShipDashboard(): void {
        const defenseCapacitor =
            this.encounterEngine
                .getDefenseCapacitorState();

        if (!defenseCapacitor) {
            throw new Error(
                'Bridge player ship requires a defense capacitor',
            );
        }

        this.gameRuntime
            .setPlayerShipDefenseCapacitorState(
                defenseCapacitor,
            );

        const shieldEmitter =
            this.encounterEngine
                .getShieldEmitterState();

        if (!shieldEmitter) {
            throw new Error(
                'Bridge player ship requires a shield emitter',
            );
        }

        this.gameRuntime
            .setPlayerShipShieldEmitterState(
                shieldEmitter,
            );

        const weapons =
            this.encounterEngine
                .getPlayerWeaponStates();

        this.gameRuntime
            .setPlayerShipWeaponStates(
                weapons,
            );

        const weaponStatus =
            mapPlayerWeaponsToBridgeStatusPayload(
                weapons,
            );

        const officerAvailability =
            this.encounterEngine
                .getOfficerAvailabilityStates();

        this.eventBus.emit(
            BRIDGE_EVENT
                .PLAYER_SHIP_DASHBOARD_UPDATED,

            mapPlayerShipToBridgeDashboardPayload({
                weapons:
                    weaponStatus,

                availableWeaponsCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.WEAPONS,
                        ),

                weaponsOfficerAvailability:
                    officerAvailability[
                        OFFICER_ROLE.WEAPONS
                    ],

                availableScienceCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.SCIENCE,
                        ),

                scienceOfficerAvailability:
                    officerAvailability[
                        OFFICER_ROLE.SCIENCE
                    ],

                playerStatus: {
                    hull:
                        this.encounterEngine
                            .getPlayerHullState(),

                    drive:
                        this.encounterEngine
                            .getDriveState(),

                    defenseCapacitor,
                },
            }),
        );
    }

    private syncCaptainCombatContext(): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .CAPTAIN_COMBAT_CONTEXT_UPDATED,

            mapCaptainCombatContextToBridgePayload({
                enemyShips:
                    this.encounterEngine
                        .getEnemyShipTelemetrySnapshots(),

                incomingMissiles:
                    this.encounterEngine
                        .getIncomingMissileProjectiles(),

                laserThreats:
                    this.encounterEngine
                        .getLaserThreatSnapshots(),

                stickyMineSnapshots:
                    this.encounterEngine
                        .getStickyMineSnapshots(),

                spamChannels:
                    this.encounterEngine
                        .getSpamChannels(),

                availableScienceCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.SCIENCE,
                        ),

                availableHelmCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.HELM,
                        ),

                availableWeaponsCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.WEAPONS,
                        ),

                availableEngineeringCommands:
                    this.encounterEngine
                        .getAvailableCommands(
                            OFFICER_ROLE.ENGINEER,
                        ),
            }),
        );
    }

    private syncPlayerShield(): void {
        const shield =
            this.encounterEngine
                .getActiveShieldState();

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

    public syncLaserThreats(): void {
        const snapshots = this.encounterEngine.getLaserThreatSnapshots();

        this.eventBus.emit(
            BRIDGE_EVENT.LASER_THREATS_UPDATED,
            snapshots.map((snapshot) => {
                return {
                    attackId: snapshot.attack.id,
                    timeToFireMs: snapshot.timeToFireMs,
                    initialTimeToFireMs: snapshot.initialTimeToFireMs,
                };
            }),
        );
    }

    private syncIncomingMissiles(): void {
        const projectiles = this.encounterEngine.getIncomingMissileProjectiles();

        this.eventBus.emit(
            BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,
            projectiles.map((projectile) => {
                return {
                    projectileId: projectile.id,
                    timeToImpactMs: projectile.timeToImpactMs,

                    ...(projectile.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED
                        ? {
                              spectralBand: projectile.identification.spectralBand,
                          }
                        : {}),
                };
            }),
        );
    }

    private syncOutgoingMissiles(): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED,
            this.encounterEngine.getOutgoingMissileProjectiles().map((projectile) => {
                return {
                    projectileId: projectile.id,
                    timeToImpactMs: projectile.timeToImpactMs,
                    initialTimeToImpactMs: projectile.initialTimeToImpactMs,
                };
            }),
        );
    }

    private syncOutgoingStickyMines(): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED,
            this.encounterEngine.getOutgoingStickyMines().map((mine) => {
                return {
                    mineId: mine.id,
                    remainingTimeToDetonationMs: mine.timeToDetonationMs,
                    initialTimeToDetonationMs: mine.initialTimeToDetonationMs,
                };
            }),
        );
    }

    private syncStickyMines(): void {
        this.eventBus.emit(
            BRIDGE_EVENT.STICKY_MINES_UPDATED,
            this.encounterEngine.getStickyMineSnapshots().map((snapshot) => {
                return {
                    mineId: snapshot.mine.id,
                    remainingTimeToDetonationMs: snapshot.mine.timeToDetonationMs,
                    initialTimeToDetonationMs: snapshot.mine.initialTimeToDetonationMs,
                    isBeingCleared: snapshot.isBeingCleared,
                    isNextClearTarget: snapshot.isNextClearTarget,
                };
            }),
        );
    }

}
