// src/engine/encounter/combat/enemy/EnemyDecisionPolicy.ts

import {
    ENEMY_BEHAVIOR_RULES,
} from '../../../content/catalogs/enemy_behavior_rules';
import {
    SHIELD_GENERATORS,
} from '../../../content/catalogs/shield_generators';
import {
    getTimedOfficerTaskDurationMs,
} from '../../../content/catalogs/officer_tasks';
import {
    OFFICER_TASK_KIND,
} from '../../../defs/officer_task';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../../defs/officer';
import {
    DEFENSE_TURRET_PHASE,
} from '../../../defs/defense_turret';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
} from '../../../defs/ship_weapon';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import {
    ENEMY_THREAT_KIND,
} from '../../model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import type {
    EnemyCaptainDecisionSnapshot,
    EnemyCaptainThreatSnapshot,
    EnemyCaptainWeaponSnapshot,
} from '../queries/get_enemy_captain_decision_snapshot';

export type EnemyWorkIntent =
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .DEPLOY_SHIELD;

          role:
              typeof OFFICER_ROLE.ENGINEER;

          observationId: string;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .PURGE_SPAM;

          role:
              typeof OFFICER_ROLE.SCIENCE;

          channelId: string;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .IDENTIFY_THREAT;

          role:
              typeof OFFICER_ROLE.SCIENCE;

          observationId: string;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .OPERATE_WEAPON;

          role: OfficerRole;
          weaponId: string;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .CLEAR_STICKY_MINE;

          role: OfficerRole;

          mineId: string;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .INTERCEPT_MISSILE;

          role:
              typeof OFFICER_ROLE.WEAPONS;

          defenseTurretId: string;
          projectileId: string;
      };

type EnemyOffenseIntent =
    Extract<
        EnemyWorkIntent,
        {
            kind:
                typeof SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON;
        }
    >;

type EnemyDefenseIntent =
    Exclude<
        EnemyWorkIntent,
        EnemyOffenseIntent
    >;

type EnemyOffenseCandidate = {
    intent: EnemyOffenseIntent;

    operatorBusyDurationMs:
        number;
};

type EnemyDefenseCandidate = {
    intent: EnemyDefenseIntent;

    actionDurationMs: number;

    // Undefined means there is no hard impact deadline.
    // Same-role offense still blocks such work.
    estimatedDeadlineMs?:
        number;
};

const ENEMY_MINE_CLEAR_ROLE_PRIORITY = [
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
] as const;

const ENEMY_OFFENSIVE_ROLE_PRIORITY = [
    OFFICER_ROLE.WEAPONS,
    OFFICER_ROLE.SCIENCE,
] as const;

// One-step enemy captain policy.
//
// It finds one best defense and one best offense.
// If offense does not endanger the known defense,
// captain attacks without randomness.
//
// If offense would make the defense unavailable,
// aggression 0..100 becomes the chance to accept that risk.
//
// No long future tree is simulated:
// only the next captain decision opportunity and
// the selected weapon's operator occupancy are considered.
//
// EnemyWorkExecutor still re-validates the selected intent
// against authoritative mutable state before starting work.
export default class EnemyDecisionPolicy {
    private readonly random:
        () => number;

    constructor(
        random: () => number =
            Math.random,
    ) {
        this.random = random;
    }

    public selectWork(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyWorkIntent | undefined {
        const defense =
            this.selectDefense(
                snapshot,
            );

        const offense =
            this.selectWeaponOperation(
                snapshot,
            );

        if (!defense) {
            return offense?.intent;
        }

        if (!offense) {
            return defense.intent;
        }

        if (
            !this.doesOffenseRiskDefense(
                snapshot,
                offense,
                defense,
            )
        ) {
            return offense.intent;
        }

        return this.shouldTakeAggressionRisk(
            snapshot.aggression,
        )
            ? offense.intent
            : defense.intent;
    }

    private selectDefense(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        return (
            this.selectMineClearing(
                snapshot,
            ) ??
            this.selectShieldDeployment(
                snapshot,
            ) ??
            this.selectSpamPurging(
                snapshot,
            ) ??
            this.selectDefenseTurretInterception(
                snapshot,
            ) ??
            this.selectThreatIdentification(
                snapshot,
            )
        );
    }

    private selectMineClearing(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        const clearDurationMs =
            getTimedOfficerTaskDurationMs(
                OFFICER_TASK_KIND
                    .CLEAR_STICKY_MINE,
            );

        const claimedMineIds =
            new Set(
                snapshot
                    .claimedStickyMineIds,
            );

        let selectedMine:
            Extract<
                EnemyCaptainThreatSnapshot,
                {
                    kind:
                        typeof ENEMY_THREAT_KIND
                            .STICKY_MINE;
                }
            > |
            undefined;

        for (
            const threat of
            snapshot.threats
        ) {
            if (
                threat.kind !==
                    ENEMY_THREAT_KIND
                        .STICKY_MINE ||
                claimedMineIds.has(
                    threat.mineId,
                ) ||
                !this.hasEnoughEstimatedTime(
                    threat
                        .estimatedTimeToDetonationMs,
                    clearDurationMs,
                )
            ) {
                continue;
            }

            if (
                !selectedMine ||
                threat
                    .estimatedTimeToDetonationMs <
                    selectedMine
                        .estimatedTimeToDetonationMs
            ) {
                selectedMine =
                    threat;
            }
        }

        if (!selectedMine) {
            return undefined;
        }

        const role =
            ENEMY_MINE_CLEAR_ROLE_PRIORITY
                .find((candidate) => {
                    return this
                        .isRoleAvailable(
                            snapshot,
                            candidate,
                        );
                });

        if (!role) {
            return undefined;
        }

        return {
            intent: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .CLEAR_STICKY_MINE,

                role,

                mineId:
                    selectedMine.mineId,
            },

            actionDurationMs:
                clearDurationMs,

            estimatedDeadlineMs:
                selectedMine
                    .estimatedTimeToDetonationMs,
        };
    }

    private selectShieldDeployment(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        if (
            !this.isRoleAvailable(
                snapshot,
                OFFICER_ROLE.ENGINEER,
            )
        ) {
            return undefined;
        }

        const emitter =
            snapshot
                .shieldGenerator;

        if (
            !emitter ||
            emitter.status !==
                SHIELD_GENERATOR_STATUS
                    .ONLINE ||
            emitter.phase !==
                SHIELD_GENERATOR_PHASE
                    .READY ||
            snapshot.hasActiveShield ||
            snapshot.powerCoreCharges <= 0
        ) {
            return undefined;
        }

        const beamCannonThreat =
            snapshot.threats.find(
                (
                    candidate,
                ): candidate is Extract<
                    EnemyCaptainThreatSnapshot,
                    {
                        kind:
                            typeof ENEMY_THREAT_KIND
                                .BEAM_CANNON;
                    }
                > => {
                    return (
                        candidate.kind ===
                        ENEMY_THREAT_KIND
                            .BEAM_CANNON
                    );
                },
            );

        if (!beamCannonThreat) {
            return undefined;
        }

        const emitterDefinition =
            SHIELD_GENERATORS[
                emitter
                    .shieldGeneratorId
            ];

        const deploymentDurationMs =
            getTimedOfficerTaskDurationMs(
                OFFICER_TASK_KIND
                    .ENGINEER_DEPLOY_SHIELD,
            );

        const deploymentWindowStartMs =
            deploymentDurationMs +
            emitterDefinition
                .shieldDurationMs -
            ENEMY_BEHAVIOR_RULES
                .shield_placement
                .impactReserveMs;

        const estimatedRemainingMs =
            beamCannonThreat
                .estimatedRemainingChargeMs;

        if (
            estimatedRemainingMs >
            deploymentWindowStartMs
        ) {
            return undefined;
        }

        if (
            !this.hasEnoughEstimatedTime(
                estimatedRemainingMs,
                deploymentDurationMs,
            )
        ) {
            return undefined;
        }

        return {
            intent: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .DEPLOY_SHIELD,

                role:
                    OFFICER_ROLE.ENGINEER,

                observationId:
                    beamCannonThreat
                        .observationId,
            },

            actionDurationMs:
                deploymentDurationMs,

            estimatedDeadlineMs:
                estimatedRemainingMs,
        };
    }

    private selectSpamPurging(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        if (
            !this.isRoleAvailable(
                snapshot,
                OFFICER_ROLE.SCIENCE,
            )
        ) {
            return undefined;
        }

        const channelId =
            snapshot
                .incomingSpamChannelIds[
                    0
                ];

        if (!channelId) {
            return undefined;
        }

        return {
            intent: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .PURGE_SPAM,

                role:
                    OFFICER_ROLE.SCIENCE,

                channelId,
            },

            actionDurationMs:
                getTimedOfficerTaskDurationMs(
                    OFFICER_TASK_KIND
                        .SCIENCE_PURGE_SPAM,
                ),
        };
    }

    private selectDefenseTurretInterception(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        if (
            !this.isRoleAvailable(
                snapshot,
                OFFICER_ROLE.WEAPONS,
            )
        ) {
            return undefined;
        }

        const defenseTurret =
            snapshot.defenseTurret;

        if (
            !defenseTurret ||
            defenseTurret.phase !==
                DEFENSE_TURRET_PHASE
                    .READY ||
            snapshot.powerCoreCharges <= 0
        ) {
            return undefined;
        }

        let selectedMissile:
            Extract<
                EnemyCaptainThreatSnapshot,
                {
                    kind:
                        typeof ENEMY_THREAT_KIND
                            .MISSILE;
                }
            > |
            undefined;

        for (
            const threat of
            snapshot.threats
        ) {
            if (
                threat.kind !==
                    ENEMY_THREAT_KIND
                        .MISSILE ||
                !this.hasEnoughEstimatedTime(
                    threat
                        .estimatedTimeToImpactMs,
                    defenseTurret
                        .loadDurationMs,
                )
            ) {
                continue;
            }

            if (
                !selectedMissile ||
                threat
                    .estimatedTimeToImpactMs <
                    selectedMissile
                        .estimatedTimeToImpactMs
            ) {
                selectedMissile =
                    threat;
            }
        }

        if (!selectedMissile) {
            return undefined;
        }

        return {
            intent: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .INTERCEPT_MISSILE,

                role:
                    OFFICER_ROLE.WEAPONS,

                defenseTurretId:
                    defenseTurret.id,

                projectileId:
                    selectedMissile
                        .projectileId,
            },

            actionDurationMs:
                defenseTurret
                    .loadDurationMs,

            estimatedDeadlineMs:
                selectedMissile
                    .estimatedTimeToImpactMs,
        };
    }

    private selectThreatIdentification(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyDefenseCandidate | undefined {
        if (
            !this.isRoleAvailable(
                snapshot,
                OFFICER_ROLE.SCIENCE,
            )
        ) {
            return undefined;
        }

        const observationId =
            snapshot
                .unresolvedMissileObservationIds[
                    0
                ];

        if (!observationId) {
            return undefined;
        }

        const missileThreat =
            snapshot.threats.find(
                (threat) => {
                    return (
                        threat.kind ===
                            ENEMY_THREAT_KIND
                                .MISSILE &&
                        threat.observationId ===
                            observationId
                    );
                },
            );

        return {
            intent: {
                kind:
                    SHIP_CREW_TASK_KIND
                        .IDENTIFY_THREAT,

                role:
                    OFFICER_ROLE.SCIENCE,

                observationId,
            },

            actionDurationMs:
                getTimedOfficerTaskDurationMs(
                    OFFICER_TASK_KIND
                        .SCIENCE_IDENTIFY_THREAT,
                ),

            estimatedDeadlineMs:
                missileThreat?.kind ===
                    ENEMY_THREAT_KIND
                        .MISSILE
                    ? missileThreat
                          .estimatedTimeToImpactMs
                    : undefined,
        };
    }

    private selectWeaponOperation(
        snapshot:
            EnemyCaptainDecisionSnapshot,
    ): EnemyOffenseCandidate | undefined {
        for (
            const role of
            ENEMY_OFFENSIVE_ROLE_PRIORITY
        ) {
            if (
                !this.isRoleAvailable(
                    snapshot,
                    role,
                )
            ) {
                continue;
            }

            const weapon =
                this.selectWeapon(
                    snapshot,
                    role,
                );

            if (!weapon) {
                continue;
            }

            return {
                intent: {
                    kind:
                        SHIP_CREW_TASK_KIND
                            .OPERATE_WEAPON,

                    role,
                    weaponId:
                        weapon.id,
                },

                operatorBusyDurationMs:
                    weapon
                        .operatorBusyDurationMs,
            };
        }

        return undefined;
    }

    private doesOffenseRiskDefense(
        snapshot:
            EnemyCaptainDecisionSnapshot,
        offense:
            EnemyOffenseCandidate,
        defense:
            EnemyDefenseCandidate,
    ): boolean {
        const sameRole =
            offense.intent.role ===
            defense.intent.role;

        if (
            defense
                .estimatedDeadlineMs ===
            undefined
        ) {
            return sameRole;
        }

        const roleWaitMs =
            sameRole
                ? offense
                      .operatorBusyDurationMs
                : 0;

        const earliestDefenseStartMs =
            Math.max(
                snapshot
                    .nextDecisionInMs,
                roleWaitMs,
            );

        const estimatedRemainingAfterWaitMs =
            defense
                .estimatedDeadlineMs -
            earliestDefenseStartMs;

        return (
            !this.hasEnoughEstimatedTime(
                estimatedRemainingAfterWaitMs,
                defense
                    .actionDurationMs,
            )
        );
    }

    private shouldTakeAggressionRisk(
        aggression: number,
    ): boolean {
        if (aggression <= 0) {
            return false;
        }

        if (aggression >= 100) {
            return true;
        }

        return (
            this.random() * 100 <
            aggression
        );
    }

    private selectWeapon(
        snapshot:
            EnemyCaptainDecisionSnapshot,
        role: OfficerRole,
    ):
        EnemyCaptainWeaponSnapshot |
        undefined {
        return snapshot.weapons.find(
            (weapon) => {
                return (
                    this.getWeaponRole(
                        weapon,
                    ) === role &&
                    this.canOperateWeapon(
                        weapon,
                    )
                );
            },
        );
    }

    private isRoleAvailable(
        snapshot:
            EnemyCaptainDecisionSnapshot,
        role: OfficerRole,
    ): boolean {
        return snapshot
            .availableRoles
            .includes(
                role,
            );
    }

    private getWeaponRole(
        weapon:
            EnemyCaptainWeaponSnapshot,
    ): OfficerRole {
        if (
            weapon.kind ===
            SHIP_WEAPON_KIND
                .SPAM_PROJECTOR
        ) {
            return OFFICER_ROLE.SCIENCE;
        }

        return OFFICER_ROLE.WEAPONS;
    }

    private canOperateWeapon(
        weapon:
            EnemyCaptainWeaponSnapshot,
    ): boolean {
        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER:
                return (
                    (
                        weapon
                            .ammoCount ??
                        0
                    ) > 0
                );

            case SHIP_WEAPON_KIND
                .BEAM_CANNON:
                return true;

            case SHIP_WEAPON_KIND
                .SPAM_PROJECTOR:
                return (
                    weapon
                        .activeChannelId ===
                    null
                );

            case SHIP_WEAPON_KIND
                .STICKY_MINE_DISPENSER:
                return (
                    (
                        weapon
                            .ammoCount ??
                        0
                    ) > 0
                );
        }
    }

    private hasEnoughEstimatedTime(
        estimatedRemainingMs: number,
        actionDurationMs: number,
    ): boolean {
        return (
            estimatedRemainingMs >
            actionDurationMs
        );
    }
}
