import { OFFICER_ROLE } from "../../../../../../../engine/defs/officer";
import type { ShipEquipmentMountState } from "../../../../../../../engine/defs/ship_slot";
import type { EncounterPresentationSnapshot } from "../../../../../../../engine/encounter/snapshots/encounter_presentation_snapshot";
import { BRIDGE_EVENT } from "../../../events/bridge_event";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    mapDefenseTurretThreatsToBridgePayload,
} from "../../captain_dashboard/defense_turret/BridgeDefenseTurretThreatsMapper";
import { mapEnemyShipToBridgeDashboardPayload } from "../../captain_dashboard/BridgeEnemyShipDashboardMapper";
import { mapPlayerShipToBridgeDashboardPayload } from "../../captain_dashboard/BridgePlayerShipDashboardMapper";

// App-side transport for continuously changing encounter read models.
//
// Один EncounterPresentationSnapshot представляет одну фотографию combat frame.
// Engine остаётся единственным владельцем mutable encounter state; synchronizer
// только переводит detached read-model в bridge presentation events.
// Persistent RunState write-back живёт в BridgeEncounterPersistenceSynchronizer.
//
// Frame orchestration передаёт один и тот же snapshot в dashboard и combat
// presentation. Synchronizer сам не читает engine и не может случайно
// собрать разные части одного кадра из разных snapshots.
export default class BridgeEncounterSnapshotSynchronizer {
    constructor(
        private readonly eventBus: BridgeEventBus,
        private readonly playerEquipmentLayout?: {
            chassisId: string;
            mounts: ShipEquipmentMountState[];
        },
    ) {}

    public syncInitial(snapshot: EncounterPresentationSnapshot): void {
        this.syncPlayerShipDashboard(snapshot);
        this.syncEnemyShipDashboard(snapshot);
        this.syncPlayerShield(snapshot);
        this.syncEnemyShields(snapshot);
        this.syncEnemyEvades(snapshot);
        this.syncDefenseTurretThreats(snapshot);
        this.syncPlayerEvade(snapshot);
    }

    public syncCombatPresentation(snapshot: EncounterPresentationSnapshot): void {
        this.syncIncomingMissiles(snapshot);
        this.syncOutgoingMissiles(snapshot);
        this.syncOutgoingStickyMines(snapshot);
        this.syncStickyMines(snapshot);
        this.syncPlayerShield(snapshot);
        this.syncEnemyShields(snapshot);
        this.syncEnemyEvades(snapshot);
        this.syncBeamCannonThreats(snapshot);
        this.syncDefenseTurretThreats(snapshot);
        this.syncPlayerEvade(snapshot);
        this.syncEnemyShipDashboard(snapshot);
    }

    public syncPlayerShipDashboard(snapshot: EncounterPresentationSnapshot): void {
        const powerCore = snapshot.player.powerCore;

        if (!powerCore) {
            throw new Error("Bridge player ship requires a power core");
        }

        const officerAvailability = snapshot.player.officerAvailability;

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,

            mapPlayerShipToBridgeDashboardPayload({
                weapons: snapshot.player.weapons,

                ...(this.playerEquipmentLayout
                    ? {
                          equipmentLayout: this.playerEquipmentLayout,
                      }
                    : {}),

                availableGunnerCommands: snapshot.commandsByRole[OFFICER_ROLE.GUNNER],

                gunnerOfficerAvailability: officerAvailability[OFFICER_ROLE.GUNNER],

                incomingMissiles: snapshot.incomingMissiles,

                availablePilotCommands: snapshot.commandsByRole[OFFICER_ROLE.PILOT],

                pilotOfficerAvailability: officerAvailability[OFFICER_ROLE.PILOT],

                availableScientistCommands: snapshot.commandsByRole[OFFICER_ROLE.SCIENTIST],

                scientistOfficerAvailability: officerAvailability[OFFICER_ROLE.SCIENTIST],

                officerTasks: snapshot.player.officerTasks,

                playerStatus: {
                    hull: snapshot.player.hull,

                    drive: snapshot.player.drive,

                    powerCore,

                    defenseTurret: snapshot.player.defenseTurret,

                    shieldGenerator: snapshot.player.shieldGenerator,

                    activeShield: snapshot.player.activeShield,
                },
            }),
        );
    }

    private syncEnemyShipDashboard(snapshot: EncounterPresentationSnapshot): void {
        const dashboard = snapshot.enemyShipDashboards[0];

        if (!dashboard) {
            this.eventBus.emit(BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED, null);
            return;
        }

        const enemy = snapshot.enemyShips.find((candidate) => {
            return candidate.actorId === dashboard.actorId;
        });
        const payload = mapEnemyShipToBridgeDashboardPayload(dashboard);
        const powerCore = enemy?.powerCore;

        this.eventBus.emit(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,

            {
                ...payload,

                ...(powerCore
                    ? {
                          powerCore: {
                              current: powerCore.state.charges,
                              max: powerCore.capacity,

                              ...(powerCore.rechargeProgress !== undefined
                                  ? {
                                        rechargeProgress: powerCore.rechargeProgress,
                                    }
                                  : {}),
                          },
                      }
                    : {}),
            },
        );
    }

    private syncDefenseTurretThreats(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.DEFENSE_TURRET_THREATS_UPDATED,

            mapDefenseTurretThreatsToBridgePayload({
                incomingMissiles: snapshot.incomingMissiles,

                availableGunnerCommands: snapshot.commandsByRole[OFFICER_ROLE.GUNNER],

                officerTasks: snapshot.player.officerTasks,

                playerThreatDecisionTimings: snapshot.playerThreatDecisionTimings,
            }),
        );
    }

    private syncEnemyEvades(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.ENEMY_EVADES_UPDATED,

            snapshot.enemyShips.map((enemy) => {
                return {
                    actorId: enemy.actorId,

                    phase: enemy.evade.phase,

                    phaseElapsedMs: enemy.evade.phaseElapsedMs,

                    evadeDurationMs: enemy.evadeDurationMs,
                };
            }),
        );
    }

    private syncPlayerEvade(snapshot: EncounterPresentationSnapshot): void {
        const evade = snapshot.player.evade;

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_EVADE_UPDATED,

            {
                phase: evade.phase,

                phaseElapsedMs: evade.phaseElapsedMs,
            },
        );
    }

    private syncPlayerShield(snapshot: EncounterPresentationSnapshot): void {
        const shield = snapshot.player.activeShield;

        this.eventBus.emit(
            BRIDGE_EVENT.PLAYER_SHIELD_UPDATED,

            shield
                ? {
                      remainingDurationMs: shield.remainingDurationMs,

                      initialDurationMs: shield.initialDurationMs,
                  }
                : null,
        );
    }

    private syncEnemyShields(snapshot: EncounterPresentationSnapshot): void {
        const shields: Array<{
            actorId: string;
            remainingDurationMs: number;
            initialDurationMs: number;
        }> = [];

        for (const enemy of snapshot.enemyShips) {
            const shield = enemy.activeShield;

            if (!shield) {
                continue;
            }

            shields.push({
                actorId: enemy.actorId,

                remainingDurationMs: shield.remainingDurationMs,

                initialDurationMs: shield.initialDurationMs,
            });
        }

        this.eventBus.emit(
            BRIDGE_EVENT.ENEMY_SHIELDS_UPDATED,

            shields,
        );
    }

    public syncBeamCannonThreats(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.BEAM_CANNON_THREATS_UPDATED,

            snapshot.beamCannonThreats.map((beamCannonThreat) => {
                return {
                    attackId: beamCannonThreat.attack.id,

                    timeToFireMs: beamCannonThreat.timeToFireMs,

                    initialTimeToFireMs: beamCannonThreat.initialTimeToFireMs,
                };
            }),
        );
    }

    private syncIncomingMissiles(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.INCOMING_MISSILES_UPDATED,

            snapshot.incomingMissiles.map((projectile) => {
                return {
                    projectileId: projectile.id,

                    timeToImpactMs: projectile.timeToImpactMs,
                };
            }),
        );
    }

    private syncOutgoingMissiles(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OUTGOING_MISSILES_UPDATED,

            snapshot.outgoingMissiles.map((projectile) => {
                return {
                    projectileId: projectile.id,

                    timeToImpactMs: projectile.timeToImpactMs,

                    initialTimeToImpactMs: projectile.initialTimeToImpactMs,
                };
            }),
        );
    }

    private syncOutgoingStickyMines(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.OUTGOING_STICKY_MINES_UPDATED,

            snapshot.outgoingStickyMines.map((mine) => {
                return {
                    mineId: mine.id,

                    remainingTimeToDetonationMs: mine.timeToDetonationMs,

                    initialTimeToDetonationMs: mine.initialTimeToDetonationMs,
                };
            }),
        );
    }

    private syncStickyMines(snapshot: EncounterPresentationSnapshot): void {
        this.eventBus.emit(
            BRIDGE_EVENT.STICKY_MINES_UPDATED,

            snapshot.stickyMineSnapshots.map((mineSnapshot) => {
                return {
                    mineId: mineSnapshot.mine.id,

                    remainingTimeToDetonationMs: mineSnapshot.mine.timeToDetonationMs,

                    initialTimeToDetonationMs: mineSnapshot.mine.initialTimeToDetonationMs,

                    isBeingCleared: mineSnapshot.isBeingCleared,

                    isNextClearTarget: mineSnapshot.isNextClearTarget,
                };
            }),
        );
    }
}
