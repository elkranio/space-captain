// src/engine/encounter/combat/PlayerWeaponRunner.ts

import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import {
    ENCOUNTER_TEAM,
} from '../../defs/encounter_team';
import {
    OFFICER_ROLE,
} from '../../defs/officer';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponDefinition,
    type LaserWeaponState,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import {
    LASER_SHOT_OUTCOME,
} from '../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../model/officer_task';
import OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';
import type EncounterStateStore from '../state/EncounterStateStore';

type WeaponsFireLaserTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_LASER;
    }
>;

type PlayerLaserImpact =
    | {
          outcome:
              typeof LASER_SHOT_OUTCOME.BLOCKED;

          remainingShieldCharges: number;
      }
    | {
          outcome:
              typeof LASER_SHOT_OUTCOME.HIT;

          damage: number;
          remainingHull: number;
      };

type PlayerWeaponRunnerOptions = {
    stateStore: EncounterStateStore;

    emit: (event: EncounterEvent) => void;

    completeOfficerTask:
        (taskId: string) => void;
};

// Владеет player weapon lifecycle.
//
// Officer task определяет:
// - кто управляет оружием;
// - выбранную цель и зону;
// - текущую производительность офицера.
//
// Cooldown — внутреннее время системы,
// поэтому не зависит от officer performance.
export default class PlayerWeaponRunner {
    private readonly performanceResolver:
        OfficerPerformanceResolver;

    constructor(
        private readonly stateStore:
            EncounterStateStore,

        private readonly emit:
            PlayerWeaponRunnerOptions['emit'],

        private readonly completeOfficerTask:
            PlayerWeaponRunnerOptions[
                'completeOfficerTask'
            ],
    ) {
        this.performanceResolver =
            new OfficerPerformanceResolver(
                this.stateStore,
            );
    }

    public static create({
        stateStore,
        emit,
        completeOfficerTask,
    }: PlayerWeaponRunnerOptions):
        PlayerWeaponRunner {
        return new PlayerWeaponRunner(
            stateStore,
            emit,
            completeOfficerTask,
        );
    }

    public step(deltaMs: number): void {
        this.advanceCooldowns(deltaMs);

        const task =
            this.stateStore.getOfficerTask(
                OFFICER_ROLE.WEAPONS,
            );

        if (
            !task ||
            task.kind !==
                OFFICER_TASK_KIND
                    .WEAPONS_FIRE_LASER
        ) {
            return;
        }

        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner отменит task
            // в конце encounter step.
            return;
        }

        const laser =
            this.findTaskLaser(task);

        if (!laser) {
            // Missing weapon также отменит task
            // через общий missing-target cleanup.
            return;
        }

        const effectiveDeltaMs =
            deltaMs *
            this.performanceResolver
                .getTaskProgressMultiplier(
                    task,
                );

        switch (laser.phase) {
            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceLaserTargeting(
                    task,
                    laser,
                    effectiveDeltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                this.advanceLaserCharging(
                    task,
                    laser,
                    effectiveDeltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.READY:
            case SHIP_WEAPON_PHASE.CHANNELING:
            case SHIP_WEAPON_PHASE.DISPENSING:
            case SHIP_WEAPON_PHASE.COOLDOWN:
                throw new Error(
                    'Player laser task has ' +
                        'invalid weapon phase: ' +
                        `${task.id}/` +
                        `${laser.id}/` +
                        `${laser.phase}`,
                );

            default:
                return assertNever(laser.phase);
        }
    }

    private advanceCooldowns(
        deltaMs: number,
    ): void {
        const weapons =
            this.stateStore
                .getState()
                .combat
                .playerWeapons;

        for (const weapon of weapons) {
            if (
                weapon.phase !==
                SHIP_WEAPON_PHASE.COOLDOWN
            ) {
                continue;
            }

            const definition =
                this.getWeaponDefinition(
                    weapon,
                );

            weapon.phaseElapsedMs += deltaMs;

            if (
                weapon.phaseElapsedMs <
                definition.cooldownDurationMs
            ) {
                continue;
            }

            weapon.phase =
                SHIP_WEAPON_PHASE.READY;

            weapon.phaseElapsedMs = 0;

            if (
                weapon.kind ===
                SHIP_WEAPON_KIND
                    .STICKY_MINE_DISPENSER
            ) {
                weapon.dispensedMineCount = 0;
            }
        }
    }

    private advanceLaserTargeting(
        task: WeaponsFireLaserTaskState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            laser.phaseElapsedMs + deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            laser.phaseElapsedMs =
                elapsedMs;

            return;
        }

        const definition =
            this.getLaserDefinition(laser);

        laser.phase =
            SHIP_WEAPON_PHASE.CHARGING;

        // Enemy laser использует тот же контракт:
        // overflow targeting-фазы не переносится.
        laser.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_CHARGING_STARTED,

            weaponId: laser.id,

            targetActorId:
                task.targetActorId,

            targetZone:
                task.targetZone,

            chargeDurationMs:
                definition.chargeDurationMs,
        });
    }

    private advanceLaserCharging(
        task: WeaponsFireLaserTaskState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const definition =
            this.getLaserDefinition(laser);

        laser.phaseElapsedMs += deltaMs;

        if (
            laser.phaseElapsedMs <
            definition.chargeDurationMs
        ) {
            return;
        }

        laser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        laser.phaseElapsedMs = 0;

        // Damage разрешается до события,
        // чтобы telemetry в этом же step
        // увидела уже новое состояние цели.
        const impact =
            this.resolveLaserImpact(
                task,
                definition.damage,
            );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_LASER_FIRED,

            weaponId: laser.id,

            targetActorId:
                task.targetActorId,

            targetZone:
                task.targetZone,

            ...impact,
        });

        // Weapons освобождается сразу после выстрела.
        // Cooldown не занимает офицера.
        this.completeOfficerTask(task.id);
    }

    private resolveLaserImpact(
        task: WeaponsFireLaserTaskState,
        damage: number,
    ): PlayerLaserImpact {
        const target =
            this.stateStore.findActorById(
                task.targetActorId,
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY
        ) {
            throw new Error(
                'Player laser target disappeared ' +
                    'before impact: ' +
                    `${task.id}/` +
                    `${task.targetActorId}`,
            );
        }

        if (
            target.shieldGenerator.charges >
            0
        ) {
            target.shieldGenerator.charges -= 1;

            // Будущая enemy shield regeneration
            // начнёт новый цикл с момента попадания.
            target
                .shieldGenerator
                .chargeRegenerationElapsedMs = 0;

            return {
                outcome:
                    LASER_SHOT_OUTCOME.BLOCKED,

                remainingShieldCharges:
                    target
                        .shieldGenerator
                        .charges,
            };
        }

        const appliedDamage =
            Math.min(
                damage,
                target.hull,
            );

        target.hull = Math.max(
            0,
            target.hull - appliedDamage,
        );

        return {
            outcome:
                LASER_SHOT_OUTCOME.HIT,

            damage: appliedDamage,
            remainingHull: target.hull,
        };
    }

    private findTaskLaser(
        task: WeaponsFireLaserTaskState,
    ): LaserWeaponState | undefined {
        const weapon =
            this.stateStore
                .getState()
                .combat
                .playerWeapons
                .find((candidate) => {
                    return (
                        candidate.id ===
                        task.weaponId
                    );
                });

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player laser task references ' +
                    'non-laser weapon: ' +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(
        task: WeaponsFireLaserTaskState,
    ): boolean {
        const actor =
            this.stateStore.findActorById(
                task.targetActorId,
            );

        return (
            actor?.team ===
            ENCOUNTER_TEAM.ENEMY
        );
    }

    private getWeaponDefinition(
        weapon: ShipWeaponState,
    ): ShipWeaponDefinition {
        const definition =
            SHIP_WEAPONS[weapon.weaponId];

        if (
            definition.kind !==
            weapon.kind
        ) {
            throw new Error(
                'Player weapon kind does not ' +
                    'match definition: ' +
                    `${weapon.id}/` +
                    `${weapon.weaponId}`,
            );
        }

        return definition;
    }

    private getLaserDefinition(
        laser: LaserWeaponState,
    ): LaserWeaponDefinition {
        const definition =
            SHIP_WEAPONS[laser.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player laser kind does not ' +
                    'match definition: ' +
                    `${laser.id}/` +
                    `${laser.weaponId}`,
            );
        }

        return definition;
    }
}

function assertNever(value: never): never {
    throw new Error(
        `Unhandled player weapon phase: ${String(value)}`,
    );
}
