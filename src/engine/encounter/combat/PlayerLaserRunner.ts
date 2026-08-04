import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
    SHIP_WEAPONS,
} from '../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponDefinition,
    type LaserWeaponState,
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
import type OfficerPerformanceResolver from '../officer_performance/OfficerPerformanceResolver';
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

type PlayerLaserRunnerOptions = {
    stateStore: EncounterStateStore;
    performanceResolver: OfficerPerformanceResolver;
    emit: (event: EncounterEvent) => void;
    completeOfficerTask:
        (taskId: string) => void;
    destroyEnemyActor:
        (actorId: string) => void;
};

// Owns the active installed player laser lifecycle: targeting, charging,
// shield/hull resolution and destruction.
export default class PlayerLaserRunner {
    constructor(
        private readonly options:
            PlayerLaserRunnerOptions,
    ) {}

    public advanceTask(
        task: WeaponsFireLaserTaskState,
        deltaMs: number,
    ): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner cancels the task
            // at the end of the encounter step.
            return;
        }

        const laser =
            this.findTaskLaser(task);

        if (!laser) {
            // Missing weapon is handled by the shared
            // missing-target cleanup.
            return;
        }

        const effectiveDeltaMs =
            deltaMs *
            this.options
                .performanceResolver
                .getTaskProgressMultiplier(
                    task,
                );

        switch (laser.phase) {
            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceTargeting(
                    task,
                    laser,
                    effectiveDeltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                this.advanceCharging(
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
                    'Player laser task has invalid weapon phase: ' +
                        `${task.id}/` +
                        `${laser.id}/` +
                        `${laser.phase}`,
                );

            default:
                return assertNever(
                    laser.phase,
                );
        }
    }

    private advanceTargeting(
        task: WeaponsFireLaserTaskState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            laser.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            laser.phaseElapsedMs =
                elapsedMs;

            return;
        }

        const definition =
            this.getDefinition(laser);

        laser.phase =
            SHIP_WEAPON_PHASE.CHARGING;

        // Incoming laser uses the same contract: targeting overflow
        // is not carried into charging.
        laser.phaseElapsedMs = 0;

        this.options.emit({
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

    private advanceCharging(
        task: WeaponsFireLaserTaskState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDefinition(laser);

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

        // Damage resolves before the event so telemetry in this
        // step already observes the new target state.
        const impact =
            this.resolveImpact(
                task,
                definition.damage,
            );

        this.options.emit({
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

        // Weapons is released immediately after firing.
        // Cooldown does not occupy the officer.
        this.options.completeOfficerTask(
            task.id,
        );

        if (
            impact.outcome ===
                LASER_SHOT_OUTCOME.HIT &&
            impact.damage > 0 &&
            impact.remainingHull === 0
        ) {
            this.options.destroyEnemyActor(
                task.targetActorId,
            );
        }
    }

    private resolveImpact(
        task: WeaponsFireLaserTaskState,
        damage: number,
    ): PlayerLaserImpact {
        const target =
            this.options.stateStore
                .findActorById(
                    task.targetActorId,
                );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY
        ) {
            throw new Error(
                'Player laser target disappeared before impact: ' +
                    `${task.id}/` +
                    `${task.targetActorId}`,
            );
        }

        if (
            target.shieldGenerator.charges >
            0
        ) {
            target.shieldGenerator.charges -= 1;

            // Future enemy shield regeneration starts a new cycle
            // from the moment of impact.
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

        const damageResult =
            this.options.stateStore
                .damageEnemyActorHull(
                    target.id,
                    damage,
                );

        return {
            outcome:
                LASER_SHOT_OUTCOME.HIT,
            damage:
                damageResult.appliedDamage,
            remainingHull:
                damageResult.remainingHull,
        };
    }

    private findTaskLaser(
        task: WeaponsFireLaserTaskState,
    ): LaserWeaponState | undefined {
        const weapon =
            this.options.stateStore
                .findPlayerWeaponById(
                    task.weaponId,
                );

        if (!weapon) {
            return undefined;
        }

        if (
            weapon.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player laser task references non-laser weapon: ' +
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
            this.options.stateStore
                .findActorById(
                    task.targetActorId,
                );

        return (
            actor?.team ===
            ENCOUNTER_TEAM.ENEMY
        );
    }

    private getDefinition(
        laser: LaserWeaponState,
    ): LaserWeaponDefinition {
        const definition =
            SHIP_WEAPONS[laser.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.LASER
        ) {
            throw new Error(
                'Player laser kind does not match definition: ' +
                    `${laser.id}/` +
                    `${laser.weaponId}`,
            );
        }

        return definition;
    }
}

function assertNever(value: never): never {
    throw new Error(
        `Unhandled player laser phase: ${String(value)}`,
    );
}
