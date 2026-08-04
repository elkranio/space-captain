import type EncounterEngine from '../../../../../../../engine/encounter/EncounterEngine';
import { THREAT_IDENTIFICATION_STATUS } from '../../../../../../../engine/encounter/model/combat';
import type { GameRuntime } from '../../../../../../runtime/GameRuntime';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
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
        this.syncPlayerWeapons();
        this.syncEnemyShipTelemetry();
    }

    public syncCombatPresentation(): void {
        this.syncIncomingMissiles();
        this.syncOutgoingMissiles();
        this.syncOutgoingStickyMines();
        this.syncStickyMines();
        this.syncLaserThreats();
        this.syncPlayerShield();
        this.syncEnemyShipTelemetry();
    }

    public syncEnemyDebug(): void {
        const [snapshot] =
            this.encounterEngine
                .getEnemyDebugSnapshots();

        this.eventBus.emit(
            BRIDGE_EVENT
                .ENEMY_DEBUG_UPDATED,

            snapshot,
        );
    }

    public syncPlayerWeapons(): void {
        const weapons = this.encounterEngine.getPlayerWeaponStates();

        this.gameRuntime.setPlayerShipWeaponStates(weapons);

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_WEAPONS_STATUS_UPDATED,
            mapPlayerWeaponsToBridgeStatusPayload(weapons),
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

                    ...(snapshot.attack.identification.status === THREAT_IDENTIFICATION_STATUS.IDENTIFIED
                        ? {
                              targetZone: snapshot.attack.identification.targetZone,
                          }
                        : {}),
                };
            }),
        );
    }

    private syncEnemyShipTelemetry(): void {
        const [snapshot] = this.encounterEngine.getEnemyShipTelemetrySnapshots();

        this.eventBus.emit(
            BRIDGE_EVENT.ENEMY_SHIP_TELEMETRY_UPDATED,
            snapshot
                ? {
                      actorId: snapshot.actorId,
                      hull: {
                          ...snapshot.hull,
                      },
                      drive: {
                          ...snapshot.drive,
                      },
                      shieldGenerator: {
                          ...snapshot.shieldGenerator,
                      },
                      weapons: snapshot.weapons.map((weapon) => {
                          return {
                              ...weapon,
                          };
                      }),
                  }
                : undefined,
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

    private syncPlayerShield(): void {
        const shield = this.encounterEngine.getActiveShieldState();

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,
            shield
                ? {
                      zone: shield.zone,
                      remainingDurationMs: Math.max(0, shield.durationMs - shield.elapsedMs),
                      initialDurationMs: shield.durationMs,
                  }
                : undefined,
        );
    }
}
