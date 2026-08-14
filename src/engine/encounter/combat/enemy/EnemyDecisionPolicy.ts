// src/engine/encounter/combat/EnemyDecisionPolicy.ts

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
    type ShipWeaponState,
} from '../../../defs/ship_weapon';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
} from '../../../defs/shield_generator';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import {
    ENEMY_THREAT_KIND,
} from '../../model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import type {
    CrewProgressEffect,
} from '../../crew_performance/get_active_crew_progress_effects';
import type {
    EnemyThreatDecisionSnapshot,
} from '../queries/get_enemy_threat_decision_snapshots';

export type EnemyDecisionContext = {
    threats:
        readonly EnemyThreatDecisionSnapshot[];

    crewProgressEffects:
        readonly CrewProgressEffect[];
};

const EMPTY_ENEMY_DECISION_CONTEXT:
    EnemyDecisionContext = {
        threats: [],
        crewProgressEffects: [],
    };

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


const ENEMY_MINE_CLEAR_ROLE_PRIORITY = [
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
] as const;

// Transitional stateless policy.
//
// EnemyBehaviorRunner всё ещё спрашивает работу
// отдельно для конкретной свободной роли.
// Mutable per-role pacing/round-robin state уже удалён:
// defense остаётся выше offense,
// а weapon work берёт первое доступное оружие
// этой роли в порядке loadout.
//
// Следующий behavior-срез заменит per-role loop
// одним captain decision tick и максимум одним intent.
export default class EnemyDecisionPolicy {
    public selectMineClearing(
        actor: ShipEncounterActorState,
        context:
            EnemyDecisionContext =
                EMPTY_ENEMY_DECISION_CONTEXT,
    ): Extract<
        EnemyWorkIntent,
        {
            kind:
                typeof SHIP_CREW_TASK_KIND
                    .CLEAR_STICKY_MINE;
        }
    > | undefined {
        const threats =
            context.threats;

        const claimedMineIds =
            new Set<string>();

        for (
            const task of
            Object.values(
                actor.crewTasks,
            )
        ) {
            if (
                task?.kind ===
                SHIP_CREW_TASK_KIND
                    .CLEAR_STICKY_MINE
            ) {
                claimedMineIds.add(
                    task.mineId,
                );
            }
        }

        let selectedMine:
            Extract<
                EnemyThreatDecisionSnapshot,
                {
                    kind:
                        typeof ENEMY_THREAT_KIND
                            .STICKY_MINE;
                }
            > |
            undefined;

        for (const threat of threats) {
            if (
                threat.kind !==
                    ENEMY_THREAT_KIND
                        .STICKY_MINE ||
                claimedMineIds.has(
                    threat.mineId,
                )
            ) {
                continue;
            }

            if (
                !selectedMine ||
                threat
                    .timeToDetonationMs <
                    selectedMine
                        .timeToDetonationMs
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
                    return (
                        actor.crewRoles
                            .includes(
                                candidate,
                            ) &&
                        actor.crewTasks[
                            candidate
                        ] === undefined
                    );
                });

        if (!role) {
            return undefined;
        }

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .CLEAR_STICKY_MINE,

            role,

            mineId:
                selectedMine.mineId,
        };
    }

    public selectWork(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        context:
            EnemyDecisionContext =
                EMPTY_ENEMY_DECISION_CONTEXT,
    ): EnemyWorkIntent | undefined {
        const threats =
            context.threats;

        // Sticky-mine defense is scheduled before role work.
        // Engineer then reacts to a live resolved player beamCannon.
        const shieldDeployment =
            this.selectShieldDeployment(
                actor,
                role,
                threats,
            );

        if (shieldDeployment) {
            return shieldDeployment;
        }

        // For idle Science, active hostile spam outranks
        // identification and offensive projector operation.
        const spamChannelId =
            this.selectSpamChannelId(
                actor,
                role,
                context
                    .crewProgressEffects,
            );

        if (spamChannelId) {
            return {
                kind:
                    SHIP_CREW_TASK_KIND
                        .PURGE_SPAM,

                role:
                    OFFICER_ROLE.SCIENCE,

                channelId:
                    spamChannelId,
            };
        }

        const observationId =
            this.selectThreatObservationId(
                actor,
                role,
            );

        if (observationId) {
            return {
                kind:
                    SHIP_CREW_TASK_KIND
                        .IDENTIFY_THREAT,

                role:
                    OFFICER_ROLE.SCIENCE,

                observationId,
            };
        }

        const interception =
            this.selectDefenseTurretInterception(
                actor,
                role,
                threats,
            );

        if (interception) {
            return interception;
        }

        const weapon =
            this.selectWeapon(
                actor,
                role,
            );

        if (!weapon) {
            return undefined;
        }

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .OPERATE_WEAPON,

            role,
            weaponId: weapon.id,
        };
    }

    private selectShieldDeployment(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        threats:
            readonly EnemyThreatDecisionSnapshot[],
    ): Extract<
        EnemyWorkIntent,
        {
            kind:
                typeof SHIP_CREW_TASK_KIND
                    .DEPLOY_SHIELD;
        }
    > | undefined {
        if (
            role !==
                OFFICER_ROLE.ENGINEER
        ) {
            return undefined;
        }

        const emitter =
            actor.shieldGenerator;

        const powerCore =
            actor.powerCore;

        if (
            !emitter ||
            emitter.status !==
                SHIELD_GENERATOR_STATUS
                    .ONLINE ||
            emitter.phase !==
                SHIELD_GENERATOR_PHASE
                    .READY ||
            actor.activeShield ||
            !powerCore ||
            powerCore.charges <= 0
        ) {
            return undefined;
        }

        const beamCannonThreat =
            threats.find(
                (
                    candidate,
                ): candidate is Extract<
                    EnemyThreatDecisionSnapshot,
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
                emitter.shieldGeneratorId
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

        // Too early: wait until one shield lifetime can cover impact.
        if (
            beamCannonThreat
                .remainingChargeMs >
            deploymentWindowStartMs
        ) {
            return undefined;
        }

        // Too late: do not commit a charge to work that cannot finish.
        if (
            beamCannonThreat
                .remainingChargeMs <=
            deploymentDurationMs
        ) {
            return undefined;
        }

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .DEPLOY_SHIELD,

            role:
                OFFICER_ROLE.ENGINEER,

            observationId:
                beamCannonThreat
                    .observationId,
        };
    }

    private selectSpamChannelId(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        effects:
            readonly CrewProgressEffect[],
    ): string | undefined {
        if (
            role !==
                OFFICER_ROLE.SCIENCE
        ) {
            return undefined;
        }

        return effects.find((effect) => {
            return (
                effect.source.kind ===
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP &&
                effect.target.kind ===
                    COMBAT_TARGET_KIND
                        .ACTOR &&
                effect.target.actorId ===
                    actor.id
            );
        })?.id;
    }

    private selectThreatObservationId(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): string | undefined {
        if (
            role !==
            OFFICER_ROLE.SCIENCE
        ) {
            return undefined;
        }

        return actor
            .threatObservations
            .find((observation) => {
                return (
                    observation.report ===
                        undefined &&
                    observation.kind ===
                        ENEMY_THREAT_KIND
                            .MISSILE
                );
            })
            ?.id;
    }

    private selectDefenseTurretInterception(
        actor: ShipEncounterActorState,
        role: OfficerRole,
        threats:
            readonly EnemyThreatDecisionSnapshot[],
    ): Extract<
        EnemyWorkIntent,
        {
            kind:
                typeof SHIP_CREW_TASK_KIND
                    .INTERCEPT_MISSILE;
        }
    > | undefined {
        if (
            role !==
            OFFICER_ROLE.WEAPONS
        ) {
            return undefined;
        }

        const defenseTurret =
            actor.defenseTurret;

        const powerCore =
            actor.powerCore;

        if (
            !defenseTurret ||
            defenseTurret.phase !==
                DEFENSE_TURRET_PHASE.READY ||
            !powerCore ||
            powerCore.charges <= 0
        ) {
            return undefined;
        }

        const missileThreat =
            threats.find(
                (
                    candidate,
                ): candidate is Extract<
                    EnemyThreatDecisionSnapshot,
                    {
                        kind:
                            typeof ENEMY_THREAT_KIND
                                .MISSILE;
                    }
                > => {
                    return (
                        candidate.kind ===
                        ENEMY_THREAT_KIND
                            .MISSILE
                    );
                },
            );

        if (!missileThreat) {
            return undefined;
        }

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .INTERCEPT_MISSILE,

            role:
                OFFICER_ROLE.WEAPONS,

            defenseTurretId:
                defenseTurret.id,

            projectileId:
                missileThreat
                    .projectileId,
        };
    }


    private selectWeapon(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipWeaponState | undefined {
        return actor.weapons.find((weapon) => {
            return (
                this.getWeaponRole(weapon) ===
                    role &&
                this.canOperateWeapon(
                    weapon,
                )
            );
        });
    }

    private getWeaponRole(
        weapon: ShipWeaponState,
    ): OfficerRole {
        if (
            weapon.kind ===
            SHIP_WEAPON_KIND.SPAM_PROJECTOR
        ) {
            return OFFICER_ROLE.SCIENCE;
        }

        return OFFICER_ROLE.WEAPONS;
    }

    private canOperateWeapon(
        weapon: ShipWeaponState,
    ): boolean {
        if (
            weapon.phase !==
            SHIP_WEAPON_PHASE.READY
        ) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return weapon.ammoCount > 0;

            case SHIP_WEAPON_KIND.BEAM_CANNON:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return (
                    weapon.activeChannelId === null
                );

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return weapon.ammoCount > 0;
        }
    }
}
