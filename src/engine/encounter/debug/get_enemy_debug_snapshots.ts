// src/engine/encounter/debug/get_enemy_debug_snapshots.ts

import {
    DEFENSE_CAPACITORS,
} from '../../content/catalogs/defense_capacitors';
import {
    MISSILES,
} from '../../content/catalogs/missiles';
import {
    POINT_DEFENSES,
} from '../../content/catalogs/point_defenses';
import {
    SHIP_WEAPONS,
} from '../../content/catalogs/ship_weapons';
import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import {
    POINT_DEFENSE_PHASE,
    type PointDefenseBeamBand,
    type PointDefensePhase,
} from '../../defs/point_defense';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../model/combat';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
    type EnemyThreatKind,
    type EnemyThreatObservationState,
} from '../model/enemy_threat_observation';
import {
    OFFICER_TASK_KIND,
} from '../model/officer_task';
import type {
    EncounterState,
} from '../model/state';
import {
    SHIP_CREW_TASK_KIND,
    type ShipCrewTaskState,
} from '../model/ship_crew_task';
import CrewPerformanceResolver from '../crew_performance/CrewPerformanceResolver';

const ENEMY_DEBUG_ROLE_ORDER = [
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.HELM,
] as const;

export type EnemyDebugProgressSnapshot = {
    elapsedMs: number;
    durationMs: number;
};

export type EnemyDebugCrewTaskSnapshot = {
    kind:
        ShipCrewTaskState['kind'];

    label: string;

    progress?:
        EnemyDebugProgressSnapshot;

    targetRemainingMs?: number;
};

export type EnemyDebugRoleSnapshot = {
    role: OfficerRole;
    present: boolean;

    task?:
        EnemyDebugCrewTaskSnapshot;
};

export type EnemyDebugDefenseCapacitorSnapshot = {
    charges: number;
    capacity: number;

    rechargeProgress?:
        EnemyDebugProgressSnapshot;
};

export type EnemyDebugPointDefenseSnapshot = {
    phase: PointDefensePhase;

    loadedBand:
        PointDefenseBeamBand | null;

    targetLabel?: string;

    progress?:
        EnemyDebugProgressSnapshot;
};

export type EnemyDebugThreatSnapshot = {
    id: string;

    label: string;
    kind: EnemyThreatKind;

    status:
        'active' |
        'stale';

    remainingMs?: number;

    report?: string;
    truth?: string;

    mismatch: boolean;
};

export type EnemyDebugSnapshot = {
    actorId: string;

    crewProgressMultiplier?: number;

    roles:
        EnemyDebugRoleSnapshot[];

    defenseCapacitor?:
        EnemyDebugDefenseCapacitorSnapshot;

    pointDefense?:
        EnemyDebugPointDefenseSnapshot;

    threats:
        EnemyDebugThreatSnapshot[];
};

// Dev-only detached read model.
//
// Separates what enemy Science reported from objective combat truth.
// App receives it only through EncounterSnapshotReader, so mutable
// EncounterState never leaks into bridge presentation.
export function getEnemyDebugSnapshots(
    state: EncounterState,
): EnemyDebugSnapshot[] {
    return state.actors
        .filter((actor) => {
            return (
                actor.team ===
                    ENCOUNTER_TEAM.ENEMY &&
                actor.hull > 0
            );
        })
        .map((actor) => {
            return createEnemyDebugSnapshot(
                state,
                actor,
            );
        });
}

function createEnemyDebugSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyDebugSnapshot {
    const crewProgressMultiplier =
        new CrewPerformanceResolver(
            state,
        ).getActorProgressMultiplier(
            actor.id,
        );

    const threats =
        createThreatSnapshots(
            state,
            actor,
        );

    const threatByObservationId =
        new Map(
            threats.map((threat) => {
                return [
                    threat.id,
                    threat,
                ] as const;
            }),
        );

    return {
        actorId:
            actor.id,

        ...(crewProgressMultiplier < 1
            ? {
                  crewProgressMultiplier,
              }
            : {}),

        roles:
            ENEMY_DEBUG_ROLE_ORDER
                .map((role) => {
                    return createRoleSnapshot(
                        state,
                        actor,
                        role,
                        threatByObservationId,
                    );
                }),

        ...(actor.defenseCapacitor
            ? {
                  defenseCapacitor:
                      createDefenseCapacitorSnapshot(
                          actor,
                      ),
              }
            : {}),

        ...(actor.pointDefense
            ? {
                  pointDefense:
                      createPointDefenseSnapshot(
                          state,
                          actor,
                      ),
              }
            : {}),

        threats,
    };
}

function createRoleSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    role: OfficerRole,
    threatByObservationId:
        ReadonlyMap<
            string,
            EnemyDebugThreatSnapshot
        >,
): EnemyDebugRoleSnapshot {
    const task =
        actor.crewTasks[role];

    return {
        role,

        present:
            actor.crewRoles.includes(
                role,
            ),

        ...(task
            ? {
                  task:
                      createCrewTaskSnapshot(
                          state,
                          actor,
                          task,
                          threatByObservationId,
                      ),
              }
            : {}),
    };
}

function createCrewTaskSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    task: ShipCrewTaskState,
    threatByObservationId:
        ReadonlyMap<
            string,
            EnemyDebugThreatSnapshot
        >,
): EnemyDebugCrewTaskSnapshot {
    switch (task.kind) {
        case SHIP_CREW_TASK_KIND
            .PURGE_SPAM:
            return {
                kind:
                    task.kind,

                label:
                    'PURGE SPAM',

                progress: {
                    elapsedMs:
                        task.elapsedMs,

                    durationMs:
                        task.durationMs,
                },
            };

        case SHIP_CREW_TASK_KIND
            .IDENTIFY_THREAT: {
            const target =
                threatByObservationId.get(
                    task.observationId,
                );

            return {
                kind:
                    task.kind,

                label:
                    'IDENTIFY ' +
                    (target?.label ?? '?'),

                progress: {
                    elapsedMs:
                        task.elapsedMs,

                    durationMs:
                        task.durationMs,
                },
            };
        }

        case SHIP_CREW_TASK_KIND
            .INTERCEPT_MISSILE: {
            const projectile =
                state.combat
                    .projectiles
                    .find((candidate) => {
                        return (
                            candidate.id ===
                            task.projectileId
                        );
                    });

            const pointDefense =
                actor.pointDefense;

            const progress =
                pointDefense &&
                pointDefense
                    .targetProjectileId ===
                    task.projectileId
                    ? createPointDefenseProgress(
                          pointDefense,
                      )
                    : undefined;

            return {
                kind:
                    task.kind,

                label:
                    'INTERCEPT ' +
                    (projectile
                        ?.designation ??
                        '?') +
                    ' ' +
                    task.beamBand
                        .toUpperCase(),

                ...(progress
                    ? {
                          progress,
                      }
                    : {}),
            };
        }


        case SHIP_CREW_TASK_KIND
            .CLEAR_STICKY_MINE: {
            const mine =
                state.combat
                    .stickyMines
                    .find((candidate) => {
                        return (
                            candidate.id ===
                                task.mineId &&
                            candidate.source.kind ===
                                COMBAT_SOURCE_KIND
                                    .PLAYER_SHIP &&
                            candidate.target.kind ===
                                COMBAT_TARGET_KIND
                                    .ACTOR &&
                            candidate.target.actorId ===
                                actor.id
                        );
                    });

            return {
                kind:
                    task.kind,

                label:
                    'CLEAN ' +
                    task.mineId,

                progress: {
                    elapsedMs:
                        task.elapsedMs,

                    durationMs:
                        task.durationMs,
                },

                ...(mine
                    ? {
                          targetRemainingMs:
                              mine
                                  .timeToDetonationMs,
                      }
                    : {}),
            };
        }

        case SHIP_CREW_TASK_KIND
            .DEPLOY_SHIELD:
            return {
                kind:
                    task.kind,

                label:
                    'DEPLOY SHIELD',

                progress: {
                    elapsedMs:
                        task.elapsedMs,

                    durationMs:
                        task.durationMs,
                },
            };

        case SHIP_CREW_TASK_KIND
            .OPERATE_WEAPON: {
            const weapon =
                actor.weapons.find(
                    (candidate) => {
                        return (
                            candidate.id ===
                            task.weaponId
                        );
                    },
                );

            return {
                kind:
                    task.kind,

                label:
                    weapon
                        ? getWeaponTaskLabel(
                              weapon,
                          )
                        : 'OPERATE MISSING !',
            };
        }

        default:
            return assertNever(task);
    }
}

function getWeaponTaskLabel(
    weapon: ShipWeaponState,
): string {
    switch (weapon.kind) {
        case SHIP_WEAPON_KIND
            .MISSILE_LAUNCHER:
            return weapon.phase ===
                SHIP_WEAPON_PHASE
                    .TARGETING
                ? 'AIM MISSILE'
                : 'OPERATE MISSILE';

        case SHIP_WEAPON_KIND.LASER:
            switch (weapon.phase) {
                case SHIP_WEAPON_PHASE
                    .TARGETING:
                    return 'AIM LASER';

                case SHIP_WEAPON_PHASE
                    .CHARGING:
                    return 'CHARGE LASER';

                default:
                    return 'OPERATE LASER';
            }

        case SHIP_WEAPON_KIND
            .STICKY_MINE_DISPENSER:
            return weapon.phase ===
                SHIP_WEAPON_PHASE
                    .DISPENSING
                ? 'DISPENSE MINES'
                : 'OPERATE MINES';

        case SHIP_WEAPON_KIND
            .SPAM_PROJECTOR:
            return weapon.phase ===
                SHIP_WEAPON_PHASE
                    .CHANNELING
                ? 'PROJECT SPAM'
                : 'OPERATE SPAM';

        default:
            return assertNever(weapon);
    }
}

function createDefenseCapacitorSnapshot(
    actor: ShipEncounterActorState,
): EnemyDebugDefenseCapacitorSnapshot {
    const defenseCapacitor =
        actor.defenseCapacitor;

    if (!defenseCapacitor) {
        throw new Error(
            'Enemy debug defense capacitor is missing: ' +
                actor.id,
        );
    }

    const definition =
        DEFENSE_CAPACITORS[
            defenseCapacitor
                .defenseCapacitorId
        ];

    return {
        charges:
            defenseCapacitor.charges,

        capacity:
            definition.capacity,

        ...(defenseCapacitor.charges <
                definition.capacity
            ? {
                  rechargeProgress: {
                      elapsedMs:
                          defenseCapacitor
                              .rechargeElapsedMs,

                      durationMs:
                          definition
                              .rechargeDurationMs,
                  },
              }
            : {}),
    };
}

function createPointDefenseSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyDebugPointDefenseSnapshot {
    const pointDefense =
        actor.pointDefense;

    if (!pointDefense) {
        throw new Error(
            'Enemy debug point defense is missing: ' +
                actor.id,
        );
    }

    const projectile =
        pointDefense
            .targetProjectileId
            ? state.combat
                  .projectiles
                  .find((candidate) => {
                      return (
                          candidate.id ===
                          pointDefense
                              .targetProjectileId
                      );
                  })
            : undefined;

    const progress =
        createPointDefenseProgress(
            pointDefense,
        );

    return {
        phase:
            pointDefense.phase,

        loadedBand:
            pointDefense.loadedBand,

        ...(pointDefense
            .targetProjectileId
            ? {
                  targetLabel:
                      projectile
                          ?.designation ??
                      '?',
              }
            : {}),

        ...(progress
            ? {
                  progress,
              }
            : {}),
    };
}

function createPointDefenseProgress(
    pointDefense:
        NonNullable<
            ShipEncounterActorState[
                'pointDefense'
            ]
        >,
):
    EnemyDebugProgressSnapshot |
    undefined {
    const definition =
        POINT_DEFENSES[
            pointDefense.pointDefenseId
        ];

    switch (pointDefense.phase) {
        case POINT_DEFENSE_PHASE.LOADING:
            return {
                elapsedMs:
                    pointDefense
                        .phaseElapsedMs,

                durationMs:
                    definition
                        .loadDurationMs,
            };

        case POINT_DEFENSE_PHASE.COOLDOWN:
            return {
                elapsedMs:
                    pointDefense
                        .phaseElapsedMs,

                durationMs:
                    definition
                        .cooldownDurationMs,
            };

        case POINT_DEFENSE_PHASE.READY:
            return undefined;

        default:
            return assertNever(
                pointDefense.phase,
            );
    }
}

function createThreatSnapshots(
    state: EncounterState,
    actor: ShipEncounterActorState,
): EnemyDebugThreatSnapshot[] {
    const counters = {
        laser: 0,
        mine: 0,
    };

    return actor
        .threatObservations
        .map((observation) => {
            switch (observation.kind) {
                case ENEMY_THREAT_KIND
                    .MISSILE:
                    return createMissileThreatSnapshot(
                        state,
                        actor,
                        observation,
                    );

                case ENEMY_THREAT_KIND.LASER:
                    counters.laser += 1;

                    return createLaserThreatSnapshot(
                        state,
                        actor,
                        observation,
                        counters.laser,
                    );

                case ENEMY_THREAT_KIND
                    .STICKY_MINE:
                    counters.mine += 1;

                    return createMineThreatSnapshot(
                        state,
                        actor,
                        observation,
                        counters.mine,
                    );

                default:
                    return assertNever(
                        observation.kind,
                    );
            }
        });
}

function createMissileThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation:
        EnemyThreatObservationState,
): EnemyDebugThreatSnapshot {
    const projectileId =
        observation.source.kind ===
            ENEMY_THREAT_SOURCE_KIND
                .COMBAT_PROJECTILE
            ? observation.source
                  .projectileId
            : undefined;

    const projectile =
        projectileId
            ? state.combat
                  .projectiles
                  .find((candidate) => {
                      return (
                          candidate.id ===
                              projectileId &&
                          candidate.source.kind ===
                              COMBAT_SOURCE_KIND
                                  .PLAYER_SHIP &&
                          candidate.target.kind ===
                              COMBAT_TARGET_KIND
                                  .ACTOR &&
                          candidate.target.actorId ===
                              actor.id
                      );
                  })
            : undefined;

    const truth =
        projectile
            ? MISSILES[
                  projectile.missileId
              ].spectralBand
            : undefined;

    const report =
        observation.report
            ? observation.report.kind ===
              ENEMY_THREAT_KIND.MISSILE
                ? observation.report
                      .spectralBand
                : 'invalid'
            : undefined;

    return {
        id:
            observation.id,

        label:
            projectile
                ?.designation ??
            'M?',

        kind:
            observation.kind,

        status:
            projectile
                ? 'active'
                : 'stale',

        ...(projectile
            ? {
                  remainingMs:
                      projectile
                          .timeToImpactMs,
              }
            : {}),

        ...(report
            ? {
                  report,
              }
            : {}),

        ...(truth
            ? {
                  truth,
              }
            : {}),

        mismatch:
            Boolean(
                report &&
                truth &&
                report !== truth,
            ),
    };
}

function createLaserThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation:
        EnemyThreatObservationState,
    index: number,
): EnemyDebugThreatSnapshot {
    const taskId =
        observation.source.kind ===
            ENEMY_THREAT_SOURCE_KIND
                .PLAYER_OFFICER_TASK
            ? observation.source
                  .officerTaskId
            : undefined;

    const task =
        taskId
            ? Object
                  .values(
                      state.officerTasks,
                  )
                  .find((candidate) => {
                      return (
                          candidate?.id ===
                          taskId
                      );
                  })
            : undefined;

    const laserTask =
        task?.kind ===
            OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER &&
        task.targetActorId === actor.id
            ? task
            : undefined;

    const weapon =
        laserTask
            ? state.combat
                  .playerWeapons
                  .find((candidate) => {
                      return (
                          candidate.id ===
                          laserTask.weaponId
                      );
                  })
            : undefined;

    const definition =
        weapon
            ? SHIP_WEAPONS[
                  weapon.weaponId
              ]
            : undefined;

    const isActive =
        Boolean(
            laserTask &&
            weapon?.kind ===
                SHIP_WEAPON_KIND.LASER &&
            weapon.phase ===
                SHIP_WEAPON_PHASE
                    .CHARGING &&
            definition?.kind ===
                SHIP_WEAPON_KIND.LASER,
        );

    const remainingMs =
        isActive &&
        weapon?.kind ===
            SHIP_WEAPON_KIND.LASER &&
        definition?.kind ===
            SHIP_WEAPON_KIND.LASER
            ? Math.max(
                  0,
                  definition
                      .chargeDurationMs -
                      weapon
                          .phaseElapsedMs,
              )
            : undefined;

    return {
        id:
            observation.id,

        label:
            'L' + index,

        kind:
            observation.kind,

        status:
            isActive
                ? 'active'
                : 'stale',

        ...(remainingMs !== undefined
            ? {
                  remainingMs,
              }
            : {}),

        // Directional player-laser truth/report was retired.
        // The observation remains useful as a physical charging telegraph.
        mismatch: false,
    };
}

function createMineThreatSnapshot(
    state: EncounterState,
    actor: ShipEncounterActorState,
    observation:
        EnemyThreatObservationState,
    index: number,
): EnemyDebugThreatSnapshot {
    const mineId =
        observation.source.kind ===
            ENEMY_THREAT_SOURCE_KIND
                .STICKY_MINE
            ? observation.source
                  .stickyMineId
            : undefined;

    const mine =
        mineId
            ? state.combat
                  .stickyMines
                  .find((candidate) => {
                      return (
                          candidate.id ===
                              mineId &&
                          candidate.source.kind ===
                              COMBAT_SOURCE_KIND
                                  .PLAYER_SHIP &&
                          candidate.target.kind ===
                              COMBAT_TARGET_KIND
                                  .ACTOR &&
                          candidate.target.actorId ===
                              actor.id
                      );
                  })
            : undefined;

    return {
        id:
            observation.id,

        label:
            'N' + index,

        kind:
            observation.kind,

        status:
            mine
                ? 'active'
                : 'stale',

        ...(mine
            ? {
                  remainingMs:
                      mine
                          .timeToDetonationMs,
              }
            : {}),

        mismatch: false,
    };
}

function assertNever(
    value: never,
): never {
    throw new Error(
        'Unhandled enemy debug value: ' +
            String(value),
    );
}
