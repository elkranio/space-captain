// src/engine/encounter/combat/EnemyDecisionPolicy.ts

import {
    OFFICER_ROLE,
    type OfficerRole,
} from '../../../defs/officer';
import {
    POINT_DEFENSE_BEAM_BAND,
    POINT_DEFENSE_PHASE,
} from '../../../defs/point_defense';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type ShipWeaponState,
} from '../../../defs/ship_weapon';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import type {
    EncounterState,
} from '../../model/state';
import {
    ENEMY_THREAT_KIND,
    ENEMY_THREAT_SOURCE_KIND,
} from '../../model/enemy_threat_observation';
import {
    SHIP_CREW_TASK_KIND,
} from '../../model/ship_crew_task';
import {
    getActivePlayerSpamChannels,
} from '../queries/get_active_player_spam_channels';

export type EnemyWorkIntent =
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
                  .DEPLOY_SHIELD;

          role:
              typeof OFFICER_ROLE.ENGINEER;

          observationId: string;
          shieldZone:
              import('../../../defs/laser')
                  .LaserTargetZone;
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

          pointDefenseId: string;
          projectileId: string;

          beamBand:
              typeof POINT_DEFENSE_BEAM_BAND.RED |
              typeof POINT_DEFENSE_BEAM_BAND.BLUE;
      };

const ENEMY_MINE_CLEAR_ROLE_PRIORITY = [
    OFFICER_ROLE.ENGINEER,
    OFFICER_ROLE.SCIENCE,
    OFFICER_ROLE.HELM,
    OFFICER_ROLE.WEAPONS,
] as const;

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
    constructor(
        private readonly random:
            () => number = Math.random,

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

    public selectMineClearing(
        actor: ShipEncounterActorState,
    ): Extract<
        EnemyWorkIntent,
        {
            kind:
                typeof SHIP_CREW_TASK_KIND
                    .CLEAR_STICKY_MINE;
        }
    > | undefined {
        const state =
            this.state;

        if (!state) {
            return undefined;
        }

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
            (
                typeof state.combat
                    .stickyMines
            )[number] |
            undefined;

        for (
            const mine of
            state.combat
                .stickyMines
        ) {
            if (
                mine.source.kind !==
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP ||
                mine.target.kind !==
                    COMBAT_TARGET_KIND
                        .ACTOR ||
                mine.target.actorId !==
                    actor.id ||
                claimedMineIds.has(
                    mine.id,
                )
            ) {
                continue;
            }

            if (
                !selectedMine ||
                mine.timeToDetonationMs <
                    selectedMine
                        .timeToDetonationMs
            ) {
                selectedMine = mine;
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
                selectedMine.id,
        };
    }

    public selectWork(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): EnemyWorkIntent | undefined {
        // Sticky-mine defense is scheduled before role work.
        // For idle Science, active hostile spam then outranks
        // identification and offensive projector operation.
        const spamChannelId =
            this.selectSpamChannelId(
                actor,
                role,
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
            this.selectPointDefenseInterception(
                actor,
                role,
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

    private selectSpamChannelId(
        actor: ShipEncounterActorState,
        role: OfficerRole,
    ): string | undefined {
        if (
            role !==
                OFFICER_ROLE.SCIENCE ||
            !this.state
        ) {
            return undefined;
        }

        return getActivePlayerSpamChannels(
            this.state,
        ).find((channel) => {
            return (
                channel.targetActorId ===
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
