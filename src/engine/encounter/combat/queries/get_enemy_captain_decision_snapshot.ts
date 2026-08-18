// src/engine/encounter/combat/queries/get_enemy_captain_decision_snapshot.ts

import { DEFENSE_TURRETS } from "../../../content/catalogs/defense_turrets";
import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import type { OfficerRole } from "../../../defs/officer";
import type { ShipDefenseTurretState } from "../../../defs/defense_turret";
import type { ShieldGeneratorState } from "../../../defs/shield_generator";
import { SHIP_WEAPON_KIND, type ShipWeaponState } from "../../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../../actors/ship/ship_encounter_actor";
import { getActiveCrewProgressEffects } from "../../crew_performance/get_active_crew_progress_effects";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../../model/combat";
import { ENEMY_THREAT_KIND } from "../../model/enemy_threat_observation";
import { SHIP_CREW_TASK_KIND } from "../../model/ship_crew_task";
import type { EncounterState } from "../../model/state";
import {
    getEnemyThreatDecisionSnapshots,
    type EnemyThreatDecisionSnapshot,
} from "./get_enemy_threat_decision_snapshots";

export type EnemyCaptainWeaponSnapshot = {
    id: string;

    kind: ShipWeaponState["kind"];

    phase: ShipWeaponState["phase"];

    // Nominal world-time occupancy of the weapon operator
    // from READY until the weapon stops requiring that role.
    //
    // Crew-performance slowdown remains execution imperfection;
    // captain policy only plans one step with nominal timings.
    operatorBusyDurationMs: number;

    ammoCount?: number;

    activeChannelId?: string | null;
};

export type EnemyCaptainThreatSnapshot =
    | {
          kind: typeof ENEMY_THREAT_KIND.MISSILE;

          observationId: string;
          projectileId: string;

          estimatedTimeToImpactMs: number;
      }
    | {
          kind: typeof ENEMY_THREAT_KIND.BEAM_CANNON;

          observationId: string;
          officerTaskId: string;
          weaponId: string;

          estimatedRemainingChargeMs: number;
      }
    | {
          kind: typeof ENEMY_THREAT_KIND.STICKY_MINE;

          observationId: string;
          mineId: string;

          estimatedTimeToDetonationMs: number;
      };

export type EnemyCaptainDecisionSnapshot = {
    actorId: string;

    aggression: number;

    // Exact cadence already rolled by EnemyBehaviorRunner.
    // If captain chooses offense now, this is the earliest
    // possible next decision opportunity.
    nextDecisionInMs: number;

    availableRoles: readonly OfficerRole[];

    claimedStickyMineIds: readonly string[];

    unresolvedMissileObservationIds: readonly string[];

    weapons: readonly EnemyCaptainWeaponSnapshot[];

    defenseTurret?: {
        id: string;

        phase: ShipDefenseTurretState["phase"];

        loadDurationMs: number;
    };

    powerCoreCharges: number;

    shieldGenerator?: {
        shieldGeneratorId: ShieldGeneratorState["shieldGeneratorId"];

        status: ShieldGeneratorState["status"];

        phase: ShieldGeneratorState["phase"];
    };

    hasActiveShield: boolean;

    threats: readonly EnemyCaptainThreatSnapshot[];

    incomingSpamChannelIds: readonly string[];
};

// Internal read model for one enemy captain decision.
//
// This is the mutable-state -> policy boundary.
// Policy sees detached perceived facts, not authoritative state.
//
// A single symmetric threatTimingErrorMs is rolled once
// for the captain decision and applied to every threat clock.
// Therefore policy never receives the objective remaining time.
//
// Hidden missile signature truth also never enters this snapshot.
export function getEnemyCaptainDecisionSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    threatTimingErrorMs = 0,
): EnemyCaptainDecisionSnapshot {
    const availableRoles = actor.crewRoles.filter((role) => {
        return actor.crewTasks[role] === undefined;
    });

    const claimedStickyMineIds: string[] = [];

    for (const task of Object.values(actor.crewTasks)) {
        if (task?.kind === SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE) {
            claimedStickyMineIds.push(task.mineId);
        }
    }

    const unresolvedMissileObservationIds = actor.threatObservations
        .filter((observation) => {
            return observation.kind === ENEMY_THREAT_KIND.MISSILE && observation.report === undefined;
        })
        .map((observation) => {
            return observation.id;
        });

    const incomingSpamChannelIds = getActiveCrewProgressEffects(state)
        .filter((effect) => {
            return (
                effect.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                effect.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                effect.target.actorId === actor.id
            );
        })
        .map((effect) => {
            return effect.id;
        });

    return {
        actorId: actor.id,

        aggression: actor.behavior.aggression,

        nextDecisionInMs: actor.decision.decisionTickRemainingMs,

        availableRoles,

        claimedStickyMineIds,

        unresolvedMissileObservationIds,

        weapons: actor.weapons.map(createWeaponSnapshot),

        defenseTurret: actor.defenseTurret ? createDefenseTurretSnapshot(actor.defenseTurret) : undefined,

        powerCoreCharges: actor.powerCore?.charges ?? 0,

        shieldGenerator: actor.shieldGenerator
            ? {
                  shieldGeneratorId: actor.shieldGenerator.shieldGeneratorId,

                  status: actor.shieldGenerator.status,

                  phase: actor.shieldGenerator.phase,
              }
            : undefined,

        hasActiveShield: actor.activeShield !== undefined,

        threats: getEnemyThreatDecisionSnapshots(state, actor).map((threat) => {
            return createCaptainThreatSnapshot(threat, threatTimingErrorMs);
        }),

        incomingSpamChannelIds,
    };
}

function createDefenseTurretSnapshot(
    defenseTurret: ShipDefenseTurretState,
): NonNullable<EnemyCaptainDecisionSnapshot["defenseTurret"]> {
    return {
        id: defenseTurret.id,

        phase: defenseTurret.phase,

        loadDurationMs: DEFENSE_TURRETS[defenseTurret.defenseTurretId].loadDurationMs,
    };
}

function createCaptainThreatSnapshot(
    threat: EnemyThreatDecisionSnapshot,
    threatTimingErrorMs: number,
): EnemyCaptainThreatSnapshot {
    switch (threat.kind) {
        case ENEMY_THREAT_KIND.MISSILE:
            return {
                kind: threat.kind,

                observationId: threat.observationId,

                projectileId: threat.projectileId,

                estimatedTimeToImpactMs: applyTimingError(threat.timeToImpactMs, threatTimingErrorMs),
            };

        case ENEMY_THREAT_KIND.BEAM_CANNON:
            return {
                kind: threat.kind,

                observationId: threat.observationId,

                officerTaskId: threat.officerTaskId,

                weaponId: threat.weaponId,

                estimatedRemainingChargeMs: applyTimingError(threat.remainingChargeMs, threatTimingErrorMs),
            };

        case ENEMY_THREAT_KIND.STICKY_MINE:
            return {
                kind: threat.kind,

                observationId: threat.observationId,

                mineId: threat.mineId,

                estimatedTimeToDetonationMs: applyTimingError(threat.timeToDetonationMs, threatTimingErrorMs),
            };
    }
}

function applyTimingError(actualRemainingMs: number, threatTimingErrorMs: number): number {
    return Math.max(0, actualRemainingMs + threatTimingErrorMs);
}

function createWeaponSnapshot(weapon: ShipWeaponState): EnemyCaptainWeaponSnapshot {
    const operatorBusyDurationMs = getWeaponOperatorBusyDurationMs(weapon);

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return {
                id: weapon.id,

                kind: weapon.kind,

                phase: weapon.phase,

                operatorBusyDurationMs,

                ammoCount: weapon.ammoCount,
            };

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return {
                id: weapon.id,

                kind: weapon.kind,

                phase: weapon.phase,

                operatorBusyDurationMs,

                activeChannelId: weapon.activeChannelId,
            };

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            return {
                id: weapon.id,

                kind: weapon.kind,

                phase: weapon.phase,

                operatorBusyDurationMs,
            };
    }
}

function getWeaponOperatorBusyDurationMs(weapon: ShipWeaponState): number {
    const definition = SHIP_WEAPONS[weapon.weaponId];

    if (!definition || definition.kind !== weapon.kind) {
        throw new Error("Captain weapon definition mismatch: " + weapon.id + "/" + weapon.weaponId + "/" + weapon.kind);
    }

    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            if (definition.kind !== SHIP_WEAPON_KIND.MISSILE_LAUNCHER) {
                throw new Error("Missile launcher definition mismatch: " + weapon.weaponId);
            }

            return definition.targetingDurationMs;

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
                throw new Error("Beam cannon definition mismatch: " + weapon.weaponId);
            }

            return definition.chargeDurationMs;

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            if (definition.kind !== SHIP_WEAPON_KIND.SPAM_PROJECTOR) {
                throw new Error("Spam projector definition mismatch: " + weapon.weaponId);
            }

            return definition.channelDurationMs;

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER: {
            if (definition.kind !== SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER) {
                throw new Error("Sticky mine definition mismatch: " + weapon.weaponId);
            }

            const launchCount = Math.min(weapon.ammoCount, definition.salvoSize);

            const dispensingDurationMs = Math.max(0, launchCount - 1) * definition.launchIntervalMs;

            return dispensingDurationMs;
        }
    }
}
