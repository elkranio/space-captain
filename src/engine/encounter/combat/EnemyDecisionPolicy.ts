// src/engine/encounter/combat/EnemyDecisionPolicy.ts

import {
    SHIP_WEAPONS,
} from '../../content/catalogs/ship_weapons';
import {
    OFFICER_TASK_BASE_DURATION_MS,
} from '../../content/rules/officer_tasks';
import {
    ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS,
    SHIP_SHIELD_DURATION_MS,
} from '../../content/rules/shields';
import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../defs/officer';
import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_PHASE,
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
    OFFICER_TASK_KIND,
} from '../model/officer_task';
import type {
    EncounterState,
} from '../model/state';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../model/ship_crew_task';

export type EnemyWorkIntent =
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
                  .DEPLOY_SHIELD;

          role:
              typeof OFFICER_ROLE.ENGINEER;

          observationId: string;
          shieldZone:
              import('../../defs/laser')
                  .LaserTargetZone;
      }
    | {
          kind:
              typeof SHIP_CREW_TASK_KIND
                  .INTERCEPT_MISSILE;

          role:
              typeof OFFICER_ROLE.WEAPONS;

          pointDefenseId: string;
          projectileId: string;

          beamBand:
              typeof POINT_DEFENSE_BEAM_BAND.RED |
              typeof POINT_DEFENSE_BEAM_BAND.BLUE;
      };

// Пока policy намеренно простая:
//
// - выбирает одну работу для конкретной роли;
// - Science сначала идентифицирует
//   замеченную missile/laser threat;
// - иначе для роли идёт round-robin
//   по её оружию в порядке loadout;
// - недоступное оружие пропускается;
// - завершённая offensive task запускает
//   отдельную паузу только для этой роли.
//
// Scheduler исполняет выбранный intent
// и не содержит собственных priorities.
//
// Позже здесь появятся состояние боя,
// defensive priorities и разные behavior presets.
export default class EnemyDecisionPolicy {
    private readonly shieldImpactReserveMsByThreat =
        new Map<string, number>();

    constructor(
        private readonly random:
            () => number = Math.random,

        // Physical timing is observable telegraph data.
        // Hidden target zone still comes only from Science report.
        private readonly state?:
            EncounterState,
    ) {}

    public advance(
        actor: ShipEncounterActorState,
        deltaMs: number,
    ): void {
        const delays =
            actor.decision
                .offensiveTaskDelayRemainingMsByRole;

        const roles =
            Object.keys(delays) as OfficerRole[];

        for (const role of roles) {
            const remainingMs =
                delays[role];

            if (remainingMs === undefined) {
                continue;
            }

            const nextRemainingMs =
                Math.max(
                    0,
                    remainingMs - deltaMs,
                );

            if (nextRemainingMs === 0) {
                delete delays[role];
                continue;
            }

            delays[role] =
                nextRemainingMs;
        }
    }

    public onOffensiveTaskCompleted(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): void {
        const delayMs =
            actor.behavior
                .offensiveTaskDelayMs;

        if (delayMs <= 0) {
            delete actor.decision
                .offensiveTaskDelayRemainingMsByRole[
                    role
                ];

            return;
        }

        actor.decision
            .offensiveTaskDelayRemainingMsByRole[
                role
            ] = delayMs;
    }

    public selectWork(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): EnemyWorkIntent | undefined {
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
            this.selectPointDefenseInterception(
                actor,
                role,
            );

        if (interception) {
            return interception;
        }

        const shieldDeployment =
            this.selectShieldDeployment(
                actor,
                role,
            );

        if (shieldDeployment) {
            return shieldDeployment;
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
                    (
                        observation.kind ===
                            ENEMY_THREAT_KIND
                                .MISSILE ||
                        observation.kind ===
                            ENEMY_THREAT_KIND
                                .LASER
                    )
                );
            })
            ?.id;
    }

    private selectPointDefenseInterception(
        actor: ShipEncounterActorState,
        role: OfficerRole,
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

        const pointDefense =
            actor.pointDefense;

        if (
            !pointDefense ||
            pointDefense.phase !==
                POINT_DEFENSE_PHASE.READY ||
            pointDefense.charges <= 0
        ) {
            return undefined;
        }

        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.kind ===
                            ENEMY_THREAT_KIND
                                .MISSILE &&
                        candidate.source.kind ===
                            ENEMY_THREAT_SOURCE_KIND
                                .COMBAT_PROJECTILE
                    );
                });

        if (
            !observation ||
            observation.source.kind !==
                ENEMY_THREAT_SOURCE_KIND
                    .COMBAT_PROJECTILE
        ) {
            return undefined;
        }

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .INTERCEPT_MISSILE,

            role:
                OFFICER_ROLE.WEAPONS,

            pointDefenseId:
                pointDefense.id,

            projectileId:
                observation
                    .source
                    .projectileId,

            // First behavior pass is intentionally blind.
            // The physical runner never chooses or corrects this band.
            beamBand:
                this.random() < 0.5
                    ? POINT_DEFENSE_BEAM_BAND.RED
                    : POINT_DEFENSE_BEAM_BAND.BLUE,
        };
    }

    private selectShieldDeployment(
        actor: ShipEncounterActorState,
        role: OfficerRole,
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
                OFFICER_ROLE.ENGINEER ||
            !this.state ||
            actor.shieldGenerator
                .charges <= 0
        ) {
            return undefined;
        }

        const observation =
            actor
                .threatObservations
                .find((candidate) => {
                    return (
                        candidate.kind ===
                            ENEMY_THREAT_KIND
                                .LASER &&
                        candidate.report?.kind ===
                            ENEMY_THREAT_KIND
                                .LASER &&
                        candidate.source.kind ===
                            ENEMY_THREAT_SOURCE_KIND
                                .PLAYER_OFFICER_TASK
                    );
                });

        if (
            !observation ||
            observation.report?.kind !==
                ENEMY_THREAT_KIND.LASER ||
            observation.source.kind !==
                ENEMY_THREAT_SOURCE_KIND
                    .PLAYER_OFFICER_TASK
        ) {
            return undefined;
        }

        const shieldZone =
            observation.report
                .targetZone;

        if (
            actor.activeShield?.zone ===
            shieldZone
        ) {
            return undefined;
        }

        const remainingLaserMs =
            this.getRemainingPlayerLaserMs(
                observation.source
                    .officerTaskId,
            );

        if (
            remainingLaserMs ===
            undefined
        ) {
            return undefined;
        }

        const deployDurationMs =
            OFFICER_TASK_BASE_DURATION_MS
                .ENGINEER_DEPLOY_SHIELD;

        const timingKey =
            this.getShieldTimingKey(
                actor.id,
                observation.id,
            );

        const impactReserveMs =
            this.getOrCreateShieldImpactReserveMs(
                timingKey,
            );

        const deploymentWindowStartMs =
            deployDurationMs +
            SHIP_SHIELD_DURATION_MS -
            impactReserveMs;

        // Safe timing window:
        // - above deploymentWindowStartMs: too early, wait;
        // - equal to deploy duration: too late, laser wins the boundary.
        if (
            remainingLaserMs <=
                deployDurationMs ||
            remainingLaserMs >
                deploymentWindowStartMs
        ) {
            return undefined;
        }

        this.shieldImpactReserveMsByThreat
            .delete(timingKey);

        return {
            kind:
                SHIP_CREW_TASK_KIND
                    .DEPLOY_SHIELD,

            role:
                OFFICER_ROLE.ENGINEER,

            observationId:
                observation.id,

            shieldZone,
        };
    }

    private getShieldTimingKey(
        actorId: string,
        observationId: string,
    ): string {
        return (
            actorId +
            ':' +
            observationId
        );
    }

    private getOrCreateShieldImpactReserveMs(
        timingKey: string,
    ): number {
        const existing =
            this.shieldImpactReserveMsByThreat
                .get(timingKey);

        if (existing !== undefined) {
            return existing;
        }

        const randomUnit =
            Math.max(
                0,
                Math.min(
                    1,
                    this.random(),
                ),
            );

        const range =
            ENEMY_SHIELD_IMPACT_RESERVE_RANGE_MS;

        const reserveMs =
            Math.round(
                range.min +
                    (
                        range.max -
                        range.min
                    ) *
                        randomUnit,
            );

        this.shieldImpactReserveMsByThreat
            .set(
                timingKey,
                reserveMs,
            );

        return reserveMs;
    }

    private getRemainingPlayerLaserMs(
        officerTaskId: string,
    ): number | undefined {
        const state =
            this.state;

        if (!state) {
            return undefined;
        }

        const task =
            Object
                .values(
                    state.officerTasks,
                )
                .find((candidate) => {
                    return (
                        candidate?.id ===
                        officerTaskId
                    );
                });

        if (
            !task ||
            task.kind !==
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_LASER
        ) {
            return undefined;
        }

        const weapon =
            state.combat
                .playerWeapons
                .find((candidate) => {
                    return (
                        candidate.id ===
                        task.weaponId
                    );
                });

        if (
            !weapon ||
            weapon.kind !==
                SHIP_WEAPON_KIND.LASER ||
            weapon.phase !==
                SHIP_WEAPON_PHASE.CHARGING
        ) {
            return undefined;
        }

        const definition =
            SHIP_WEAPONS[
                weapon.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Enemy shield policy found ' +
                    'non-laser definition: ' +
                    weapon.id +
                    '/' +
                    weapon.weaponId,
            );
        }

        return Math.max(
            0,

            definition
                .chargeDurationMs -
                weapon.phaseElapsedMs,
        );
    }

    private selectWeapon(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): ShipWeaponState | undefined {
        if (
            (
                actor.decision
                    .offensiveTaskDelayRemainingMsByRole[
                        role
                    ] ?? 0
            ) > 0
        ) {
            return undefined;
        }

        const weapons =
            actor.weapons.filter((weapon) => {
                return (
                    this.getWeaponRole(weapon) ===
                    role
                );
            });

        if (weapons.length === 0) {
            return undefined;
        }

        const startIndex =
            actor.decision
                .nextWeaponIndexByRole[role] ??
            0;

        for (
            let offset = 0;
            offset < weapons.length;
            offset += 1
        ) {
            const index =
                (startIndex + offset) %
                weapons.length;

            const weapon = weapons[index];

            if (
                !weapon ||
                !this.canOperateWeapon(weapon)
            ) {
                continue;
            }

            actor.decision
                .nextWeaponIndexByRole[role] =
                (index + 1) % weapons.length;

            return weapon;
        }

        return undefined;
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
                return (
                    weapon.loadedMissileId !== null &&
                    weapon.ammoCount > 0
                );

            case SHIP_WEAPON_KIND.LASER:
                return true;

            case SHIP_WEAPON_KIND.SPAM_PROJECTOR:
                return (
                    weapon.activeChannelId === null
                );

            case SHIP_WEAPON_KIND.STICKY_MINE_DISPENSER:
                return (
                    weapon.loadedMineId !== null &&
                    weapon.ammoCount > 0
                );
        }
    }
}
