// src/engine/encounter/debug/get_enemy_debug_snapshots.ts

import { POWER_CORES } from "../../content/catalogs/power_cores";
import { DEFENSE_TURRETS } from "../../content/catalogs/defense_turrets";
import { SHIP_WEAPONS } from "../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../defs/encounter_team";
import { OFFICER_ROLE, type OfficerRole } from "../../defs/officer";
import { DEFENSE_TURRET_PHASE, type DefenseTurretPhase } from "../../defs/defense_turret";
import { SHIP_WEAPON_KIND, SHIP_WEAPON_PHASE, type ShipWeaponState } from "../../defs/ship_weapon";
import type { ShipEncounterActorState } from "../actors/ship_encounter_actor";
import { COMBAT_SOURCE_KIND, COMBAT_TARGET_KIND } from "../model/combat";
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatKind,
    type EnemyThreatObservationState,
} from "../model/enemy_threat_observation";
import { OFFICER_TASK_KIND } from "../model/officer_task";
import type { EncounterState } from "../model/state";
import { SHIP_CREW_TASK_KIND, type ShipCrewTaskState } from "../model/ship_crew_task";
import { getActorCrewProgressMultiplier } from "../crew_performance/get_crew_progress_multiplier";

const ENEMY_DEBUG_ROLE_ORDER = [
    OFFICER_ROLE.SCIENTIST,
    OFFICER_ROLE.GUNNER,
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.PILOT,
] as const;

export type EnemyDebugProgressSnapshot = {
    elapsedMs: number;
    durationMs: number;
};

export type EnemyDebugCrewTaskSnapshot = {
    kind: ShipCrewTaskState["kind"];

    label: string;

    progress?: EnemyDebugProgressSnapshot;

    targetRemainingMs?: number;
};

export type EnemyDebugRoleSnapshot = {
    role: OfficerRole;
    present: boolean;

    task?: EnemyDebugCrewTaskSnapshot;
};

export type EnemyDebugPowerCoreSnapshot = {
    charges: number;
    capacity: number;

    rechargeProgress?: EnemyDebugProgressSnapshot;
};

export type EnemyDebugDefenseTurretSnapshot = {
    phase: DefenseTurretPhase;

    targetLabel?: string;

    progress?: EnemyDebugProgressSnapshot;
};

export type EnemyDebugThreatSnapshot = {
    id: string;

    label: string;
    kind: EnemyThreatKind;

    status: "active" | "stale";

    remainingMs?: number;
};

export type EnemyDebugSnapshot = {
    actorId: string;

    crewProgressMultiplier?: number;

    roles: EnemyDebugRoleSnapshot[];

    powerCore?: EnemyDebugPowerCoreSnapshot;

    defenseTurret?: EnemyDebugDefenseTurretSnapshot;

    threats: EnemyDebugThreatSnapshot[];
};

// Dev-only detached read model.
//
// App receives it only through EncounterSnapshotReader, so mutable
// EncounterState never leaks into bridge presentation.
export function getEnemyDebugSnapshots(state: EncounterState): EnemyDebugSnapshot[] {
    return state.actors
        .filter((actor) => {
            return actor.team === ENCOUNTER_TEAM.ENEMY && actor.hull > 0;
        })
        .map((actor) => {
            return createEnemyDebugSnapshot(state, actor);
        });
}

function createEnemyDebugSnapshot(state: EncounterState, actor: ShipEncounterActorState): EnemyDebugSnapshot {
    const crewProgressMultiplier = getActorCrewProgressMultiplier(state, actor.id);

    const threats = createThreatSnapshots(state, actor);

    return {
        actorId: actor.id,

        ...(crewProgressMultiplier < 1
            ? {
                  crewProgressMultiplier,
              }
            : {}),

        roles: ENEMY_DEBUG_ROLE_ORDER.map((role) => {
            return createRoleSnapshot(state, actor, role);
        }),

        ...(actor.powerCore
            ? {
                  powerCore: createPowerCoreSnapshot(actor),
              }
            : {}),

        ...(actor.defenseTurret
            ? {
                  defenseTurret: createDefenseTurretSnapshot(state, actor),
              }
            : {}),

        threats,
    };
}

function createRoleSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    role: OfficerRole,
): EnemyDebugRoleSnapshot {
    const task = actor.crewTasks[role];

    return {
        role,

        present: actor.crewRoles.includes(role),

        ...(task
            ? {
                  task: createCrewTaskSnapshot(state, actor, task),
              }
            : {}),
    };
}

function createCrewTaskSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    task: ShipCrewTaskState,
): EnemyDebugCrewTaskSnapshot {
    switch (task.kind) {
        case SHIP_CREW_TASK_KIND.PURGE_SPAM:
            return {
                kind: task.kind,

                label: "PURGE SPAM",

                progress: {
                    elapsedMs: task.elapsedMs,

                    durationMs: task.durationMs,
                },
            };

        case SHIP_CREW_TASK_KIND.INTERCEPT_MISSILE: {
            const projectile = state.combat.projectiles.find((candidate) => {
                return candidate.id === task.projectileId;
            });

            const defenseTurret = actor.defenseTurret;

            const progress =
                defenseTurret && defenseTurret.targetProjectileId === task.projectileId
                    ? createDefenseTurretProgress(defenseTurret)
                    : undefined;

            return {
                kind: task.kind,

                label: "INTERCEPT " + (projectile?.designation ?? "?"),

                ...(progress
                    ? {
                          progress,
                      }
                    : {}),
            };
        }

        case SHIP_CREW_TASK_KIND.CLEAR_STICKY_MINE: {
            const mine = state.combat.stickyMines.find((candidate) => {
                return (
                    candidate.id === task.mineId &&
                    candidate.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                    candidate.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                    candidate.target.actorId === actor.id
                );
            });

            return {
                kind: task.kind,

                label: "CLEAN " + task.mineId,

                progress: {
                    elapsedMs: task.elapsedMs,

                    durationMs: task.durationMs,
                },

                ...(mine
                    ? {
                          targetRemainingMs: mine.timeToDetonationMs,
                      }
                    : {}),
            };
        }

        case SHIP_CREW_TASK_KIND.DEPLOY_SHIELD:
            return {
                kind: task.kind,

                label: "DEPLOY SHIELD",

                progress: {
                    elapsedMs: task.elapsedMs,

                    durationMs: task.durationMs,
                },
            };

        case SHIP_CREW_TASK_KIND.OPERATE_WEAPON: {
            const weapon = actor.weapons.find((candidate) => {
                return candidate.id === task.weaponId;
            });

            return {
                kind: task.kind,

                label: weapon ? getWeaponTaskLabel(weapon) : "OPERATE MISSING !",
            };
        }

        default:
            return assertNever(task);
    }
}

function getWeaponTaskLabel(weapon: ShipWeaponState): string {
    switch (weapon.kind) {
        case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
            return weapon.phase === SHIP_WEAPON_PHASE.TARGETING ? "AIM MISSILE" : "OPERATE MISSILE";

        case SHIP_WEAPON_KIND.BEAM_CANNON:
            switch (weapon.phase) {
                case SHIP_WEAPON_PHASE.TARGETING:
                    return "AIM BEAM_CANNON";

                case SHIP_WEAPON_PHASE.CHARGING:
                    return "CHARGE BEAM_CANNON";

                default:
                    return "OPERATE BEAM_CANNON";
            }

        case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
            return weapon.phase === SHIP_WEAPON_PHASE.TARGETING ? "AIM MINE" : "OPERATE MINES";

        case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
            return weapon.phase === SHIP_WEAPON_PHASE.CHANNELING ? "PROJECT SPAM" : "OPERATE SPAM";

        default:
            return assertNever(weapon);
    }
}

function createPowerCoreSnapshot(actor: ShipEncounterActorState): EnemyDebugPowerCoreSnapshot {
    const powerCore = actor.powerCore;

    if (!powerCore) {
        throw new Error("Enemy debug power core is missing: " + actor.id);
    }

    const definition = POWER_CORES[powerCore.powerCoreId];

    return {
        charges: powerCore.charges,

        capacity: definition.capacity,

        ...(powerCore.charges < definition.capacity
            ? {
                  rechargeProgress: {
                      elapsedMs: powerCore.rechargeElapsedMs,

                      durationMs: definition.rechargeDurationMs,
                  },
              }
            : {}),
    };
}

function createDefenseTurretSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyDebugDefenseTurretSnapshot {
    const defenseTurret = actor.defenseTurret;

    if (!defenseTurret) {
        throw new Error("Enemy debug defense turret is missing: " + actor.id);
    }

    const projectile = defenseTurret.targetProjectileId
        ? state.combat.projectiles.find((candidate) => {
              return candidate.id === defenseTurret.targetProjectileId;
          })
        : undefined;

    const progress = createDefenseTurretProgress(defenseTurret);

    return {
        phase: defenseTurret.phase,

        ...(defenseTurret.targetProjectileId
            ? {
                  targetLabel: projectile?.designation ?? "?",
              }
            : {}),

        ...(progress
            ? {
                  progress,
              }
            : {}),
    };
}

function createDefenseTurretProgress(
    defenseTurret: NonNullable<ShipEncounterActorState["defenseTurret"]>,
): EnemyDebugProgressSnapshot | undefined {
    const definition = DEFENSE_TURRETS[defenseTurret.defenseTurretId];

    switch (defenseTurret.phase) {
        case DEFENSE_TURRET_PHASE.LOADING:
            return {
                elapsedMs: defenseTurret.phaseElapsedMs,

                durationMs: definition.loadDurationMs,
            };

        case DEFENSE_TURRET_PHASE.COOLDOWN:
            return {
                elapsedMs: defenseTurret.phaseElapsedMs,

                durationMs: definition.cooldownDurationMs,
            };

        case DEFENSE_TURRET_PHASE.READY:
            return undefined;

        default:
            return assertNever(defenseTurret.phase);
    }
}

function createThreatSnapshots(state: EncounterState, actor: ShipEncounterActorState): EnemyDebugThreatSnapshot[] {
    const counters = {
        beamCannon: 0,
        mine: 0,
    };

    return actor.threatObservations.map((observation) => {
        switch (observation.kind) {
            case ENEMY_THREAT_KIND.MISSILE:
                return createMissileThreatSnapshot(state, actor, observation);

            case ENEMY_THREAT_KIND.BEAM_CANNON:
                counters.beamCannon += 1;

                return createBeamCannonThreatSnapshot(state, actor, observation, counters.beamCannon);

            case ENEMY_THREAT_KIND.STICKY_MINE:
                counters.mine += 1;

                return createMineThreatSnapshot(state, actor, observation, counters.mine);

            default:
                return assertNever(observation.kind);
        }
    });
}

function createMissileThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
): EnemyDebugThreatSnapshot {
    const projectileId =
        observation.source.kind === ENEMY_THREAT_SOURCE_KIND.COMBAT_PROJECTILE
            ? observation.source.projectileId
            : undefined;

    const projectile = projectileId
        ? state.combat.projectiles.find((candidate) => {
              return (
                  candidate.id === projectileId &&
                  candidate.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                  candidate.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                  candidate.target.actorId === actor.id
              );
          })
        : undefined;

    return {
        id: observation.id,

        label: projectile?.designation ?? "M?",

        kind: observation.kind,

        status: projectile ? "active" : "stale",

        ...(projectile
            ? {
                  remainingMs: projectile.timeToImpactMs,
              }
            : {}),
    };
}

function createBeamCannonThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
    index: number,
): EnemyDebugThreatSnapshot {
    const taskId =
        observation.source.kind === ENEMY_THREAT_SOURCE_KIND.PLAYER_OFFICER_TASK
            ? observation.source.officerTaskId
            : undefined;

    const task = taskId
        ? Object.values(state.officerTasks).find((candidate) => {
              return candidate?.id === taskId;
          })
        : undefined;

    const beamCannonTask =
        task?.kind === OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON && task.targetActorId === actor.id ? task : undefined;

    const weapon = beamCannonTask
        ? state.combat.playerWeapons.find((candidate) => {
              return candidate.id === beamCannonTask.weaponId;
          })
        : undefined;

    const definition = weapon ? SHIP_WEAPONS[weapon.weaponId] : undefined;

    const isActive = Boolean(
        beamCannonTask &&
        weapon?.kind === SHIP_WEAPON_KIND.BEAM_CANNON &&
        weapon.phase === SHIP_WEAPON_PHASE.CHARGING &&
        definition?.kind === SHIP_WEAPON_KIND.BEAM_CANNON,
    );

    const remainingMs =
        isActive && weapon?.kind === SHIP_WEAPON_KIND.BEAM_CANNON && definition?.kind === SHIP_WEAPON_KIND.BEAM_CANNON
            ? Math.max(0, definition.chargeDurationMs - weapon.phaseElapsedMs)
            : undefined;

    return {
        id: observation.id,

        label: "L" + index,

        kind: observation.kind,

        status: isActive ? "active" : "stale",

        ...(remainingMs !== undefined
            ? {
                  remainingMs,
              }
            : {}),
    };
}

function createMineThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation: EnemyThreatObservationState,
    index: number,
): EnemyDebugThreatSnapshot {
    const mineId =
        observation.source.kind === ENEMY_THREAT_SOURCE_KIND.STICKY_MINE ? observation.source.stickyMineId : undefined;

    const mine = mineId
        ? state.combat.stickyMines.find((candidate) => {
              return (
                  candidate.id === mineId &&
                  candidate.source.kind === COMBAT_SOURCE_KIND.PLAYER_SHIP &&
                  candidate.target.kind === COMBAT_TARGET_KIND.ACTOR &&
                  candidate.target.actorId === actor.id
              );
          })
        : undefined;

    return {
        id: observation.id,

        label: "N" + index,

        kind: observation.kind,

        status: mine ? "active" : "stale",

        ...(mine
            ? {
                  remainingMs: mine.timeToDetonationMs,
              }
            : {}),
    };
}

function assertNever(value: never): never {
    throw new Error("Unhandled enemy debug value: " + String(value));
}
