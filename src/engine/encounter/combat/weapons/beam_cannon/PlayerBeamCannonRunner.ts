import {
    SHIP_WEAPON_TARGETING_DURATION_MS,
    SHIP_WEAPONS,
} from '../../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../../defs/encounter_team';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonDefinition,
    type BeamCannonState,
} from '../../../../defs/ship_weapon';
import {
    BEAM_CANNON_SHOT_OUTCOME,
    type BeamCannonShotOutcome,
} from '../../../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../../model/event';
import {
    OFFICER_TASK_KIND,
    type OfficerTaskState,
} from '../../../model/officer_task';
import type EncounterStateStore from '../../../state/EncounterStateStore';

type WeaponsFireBeamCannonTaskState = Extract<
    OfficerTaskState,
    {
        kind:
            typeof OFFICER_TASK_KIND
                .WEAPONS_FIRE_BEAM_CANNON;
    }
>;

type PlayerBeamCannonImpact = {
    outcome:
        BeamCannonShotOutcome;

    damage: number;
    remainingHull: number;
};

type PlayerBeamCannonRunnerOptions = {
    stateStore: EncounterStateStore;
    emit: (event: EncounterEvent) => void;

    completeOfficerTask:
        (taskId: string) => void;

    destroyEnemyActor:
        (actorId: string) => void;
};

// Owns the active installed player beamCannon lifecycle:
// targeting -> charging -> whole-ship shield/hull impact -> cooldown.
//
// Node/sector targeting remains intentionally absent in this slice.
export default class PlayerBeamCannonRunner {
    constructor(
        private readonly options:
            PlayerBeamCannonRunnerOptions,
    ) {}

    public advanceTask(
        task: WeaponsFireBeamCannonTaskState,
        deltaMs: number,
    ): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner cancels the task
            // at the end of the encounter step.
            return;
        }

        const beamCannon =
            this.findTaskBeamCannon(task);

        if (!beamCannon) {
            // Missing weapon is handled by the shared
            // missing-target cleanup.
            return;
        }

        switch (beamCannon.phase) {
            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceTargeting(
                    task,
                    beamCannon,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                this.advanceCharging(
                    task,
                    beamCannon,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.READY:
            case SHIP_WEAPON_PHASE.CHANNELING:
            case SHIP_WEAPON_PHASE.DISPENSING:
            case SHIP_WEAPON_PHASE.COOLDOWN:
                throw new Error(
                    'Player beamCannon task has invalid weapon phase: ' +
                        `${task.id}/` +
                        `${beamCannon.id}/` +
                        `${beamCannon.phase}`,
                );

            default:
                return assertNever(
                    beamCannon.phase,
                );
        }
    }

    private advanceTargeting(
        task: WeaponsFireBeamCannonTaskState,
        beamCannon: BeamCannonState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            beamCannon.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            beamCannon.phaseElapsedMs =
                elapsedMs;

            return;
        }

        const definition =
            this.getDefinition(beamCannon);

        beamCannon.phase =
            SHIP_WEAPON_PHASE.CHARGING;

        // Targeting overflow is not carried into charging.
        beamCannon.phaseElapsedMs = 0;

        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_BEAM_CANNON_CHARGING_STARTED,

            weaponId:
                beamCannon.id,

            targetActorId:
                task.targetActorId,

            chargeDurationMs:
                definition.chargeDurationMs,
        });
    }

    private advanceCharging(
        task: WeaponsFireBeamCannonTaskState,
        beamCannon: BeamCannonState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDefinition(beamCannon);

        beamCannon.phaseElapsedMs += deltaMs;

        if (
            beamCannon.phaseElapsedMs <
            definition.chargeDurationMs
        ) {
            return;
        }

        beamCannon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;

        beamCannon.phaseElapsedMs = 0;

        // Impact resolves before the event so same-frame telemetry
        // already observes the consumed shield or damaged hull.
        const impact =
            this.resolveImpact(
                task,
                definition.damage,
            );

        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_BEAM_CANNON_FIRED,

            weaponId:
                beamCannon.id,

            targetActorId:
                task.targetActorId,

            ...impact,
        });

        // Weapons is released immediately after firing.
        // Cooldown does not occupy the officer.
        this.options.completeOfficerTask(
            task.id,
        );

        if (
            impact.damage > 0 &&
            impact.remainingHull === 0
        ) {
            this.options.destroyEnemyActor(
                task.targetActorId,
            );
        }
    }

    private resolveImpact(
        task: WeaponsFireBeamCannonTaskState,
        damage: number,
    ): PlayerBeamCannonImpact {
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
                'Player beamCannon target disappeared before impact: ' +
                    `${task.id}/` +
                    `${task.targetActorId}`,
            );
        }

        if (target.activeShield) {
            delete target.activeShield;

            return {
                outcome:
                    BEAM_CANNON_SHOT_OUTCOME
                        .ABSORBED,

                damage: 0,
                remainingHull:
                    target.hull,
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
                BEAM_CANNON_SHOT_OUTCOME.HIT,

            damage:
                damageResult.appliedDamage,

            remainingHull:
                damageResult.remainingHull,
        };
    }

    private findTaskBeamCannon(
        task: WeaponsFireBeamCannonTaskState,
    ): BeamCannonState | undefined {
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
            SHIP_WEAPON_KIND.BEAM_CANNON
        ) {
            throw new Error(
                'Player beamCannon task references non-beamCannon weapon: ' +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(
        task: WeaponsFireBeamCannonTaskState,
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
        beamCannon: BeamCannonState,
    ): BeamCannonDefinition {
        const definition =
            SHIP_WEAPONS[
                beamCannon.weaponId
            ];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND.BEAM_CANNON
        ) {
            throw new Error(
                'Player beamCannon kind does not match definition: ' +
                    `${beamCannon.id}/` +
                    `${beamCannon.weaponId}`,
            );
        }

        return definition;
    }
}

function assertNever(
    value: never,
): never {
    throw new Error(
        `Unhandled player beamCannon phase: ${String(value)}`,
    );
}
