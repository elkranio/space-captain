import { SHIP_WEAPONS } from "../../../content/catalogs/ship_weapons";
import { ENCOUNTER_TEAM } from "../../../defs/encounter_team";
import { isShipEvading } from "../../../defs/ship_evade";
import {
    finishShipWeaponAction,
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type BeamCannonDefinition,
    type BeamCannonState,
} from "../../../defs/ship_weapon";
import { BEAM_CANNON_SHOT_OUTCOME, type BeamCannonShotOutcome } from "../../model/combat";
import { ENCOUNTER_EVENT, type EncounterEvent } from "../../model/event";
import { OFFICER_TASK_KIND, type OfficerTaskState } from "../../model/officer_task";
import type EncounterStateStore from "../../state/EncounterStateStore";
import type OfficerTaskRunner from "../../officer_tasks/OfficerTaskRunner";
import { findShipSlotEquipment } from "../../actors/find_ship_slot_equipment";
import { damageEquipmentIntegrity } from "../../model/equipment";

type GunnerFireBeamCannonTaskState = Extract<
    OfficerTaskState,
    {
        kind: typeof OFFICER_TASK_KIND.GUNNER_FIRE_BEAM_CANNON;
    }
>;

type PlayerBeamCannonImpact = {
    outcome: BeamCannonShotOutcome;

    damage: number;
    remainingHull: number;
};

type PlayerBeamCannonRunnerOptions = {
    stateStore: EncounterStateStore;
    emit: (event: EncounterEvent) => void;

    officerTaskRunner: Pick<OfficerTaskRunner, "complete">;

    destroyEnemyActor: (actorId: string) => void;
};

// Owns the active installed player beamCannon lifecycle:
// charging -> enemy Evade/shield/semantic target resolution -> cooldown.
export default class PlayerBeamCannonRunner {
    constructor(private readonly options: PlayerBeamCannonRunnerOptions) {}

    public advanceTask(task: GunnerFireBeamCannonTaskState, deltaMs: number): void {
        if (!this.hasValidTarget(task)) {
            // OfficerTaskRunner cancels the task
            // at the end of the encounter step.
            return;
        }

        const beamCannon = this.findTaskBeamCannon(task);

        if (!beamCannon) {
            // Missing weapon is handled by the shared
            // missing-target cleanup.
            return;
        }

        if (beamCannon.phase !== SHIP_WEAPON_PHASE.CHARGING) {
            throw new Error(
                "Player beamCannon task has invalid weapon phase: " +
                    task.id +
                    "/" +
                    beamCannon.id +
                    "/" +
                    beamCannon.phase,
            );
        }

        this.advanceCharging(task, beamCannon, deltaMs);
    }

    private advanceCharging(task: GunnerFireBeamCannonTaskState, beamCannon: BeamCannonState, deltaMs: number): void {
        const definition = this.getDefinition(beamCannon);

        beamCannon.phaseElapsedMs += deltaMs;

        if (beamCannon.phaseElapsedMs < definition.chargeDurationMs) {
            return;
        }

        finishShipWeaponAction(beamCannon, definition.cooldownDurationMs);

        // Impact resolves before the event so same-frame telemetry
        // already observes the consumed shield or damaged hull.
        const impact = this.resolveImpact(task, definition);

        this.options.emit({
            type: ENCOUNTER_EVENT.PLAYER_BEAM_CANNON_FIRED,

            weaponId: beamCannon.id,

            targetActorId: task.targetActorId,

            ...impact,
        });

        // Gunner is released immediately after firing.
        // Cooldown does not occupy the officer.
        this.options.officerTaskRunner.complete(task.id);

        if (impact.damage > 0 && impact.remainingHull === 0) {
            this.options.destroyEnemyActor(task.targetActorId);
        }
    }

    private resolveImpact(task: GunnerFireBeamCannonTaskState, definition: BeamCannonDefinition): PlayerBeamCannonImpact {
        const target = this.options.stateStore.findActorById(task.targetActorId);

        if (!target || target.team !== ENCOUNTER_TEAM.ENEMY) {
            throw new Error(
                "Player beamCannon target disappeared before impact: " + `${task.id}/` + `${task.targetActorId}`,
            );
        }

        // Physical resolution order mirrors the player defensive contract:
        //
        // EVADING -> MISS
        // otherwise active shield -> ABSORBED
        // otherwise -> HIT
        //
        // A Beam that misses because of Evade never reaches the shield.
        if (isShipEvading(target.evade)) {
            return {
                outcome: BEAM_CANNON_SHOT_OUTCOME.MISS,

                damage: 0,
                remainingHull: target.hull,
            };
        }

        if (target.activeShield) {
            delete target.activeShield;

            return {
                outcome: BEAM_CANNON_SHOT_OUTCOME.ABSORBED,

                damage: 0,
                remainingHull: target.hull,
            };
        }

        let hullDamage = definition.hullDamage;
        if (task.target.kind === "slot") {
            const equipment = findShipSlotEquipment(target, task.target.slotId);
            if (!equipment) {
                throw new Error("Player Beam target slot disappeared before impact: " + task.target.slotId);
            }

            // Evaluate BROKEN at impact. A shot that breaks equipment never spills into Hull.
            if (equipment.integrity > 0) {
                damageEquipmentIntegrity(equipment, definition.moduleDamage);
                return {
                    outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,
                    damage: 0, // Existing presentation event reports Hull damage.
                    remainingHull: target.hull,
                };
            }
            hullDamage *= 2;
        }

        const damageResult = this.options.stateStore.damageEnemyActorHull(target.id, hullDamage);

        return {
            outcome: BEAM_CANNON_SHOT_OUTCOME.HIT,

            damage: damageResult.appliedDamage,

            remainingHull: damageResult.remainingHull,
        };
    }

    private findTaskBeamCannon(task: GunnerFireBeamCannonTaskState): BeamCannonState | undefined {
        const weapon = this.options.stateStore.findPlayerWeaponById(task.weaponId);

        if (!weapon) {
            return undefined;
        }

        if (weapon.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error(
                "Player beamCannon task references non-beamCannon weapon: " +
                    `${task.id}/` +
                    `${weapon.id}/` +
                    `${weapon.kind}`,
            );
        }

        return weapon;
    }

    private hasValidTarget(task: GunnerFireBeamCannonTaskState): boolean {
        const actor = this.options.stateStore.findActorById(task.targetActorId);

        return actor?.team === ENCOUNTER_TEAM.ENEMY &&
            (task.target.kind === "hull" || !!findShipSlotEquipment(actor, task.target.slotId));
    }

    private getDefinition(beamCannon: BeamCannonState): BeamCannonDefinition {
        const definition = SHIP_WEAPONS[beamCannon.weaponId];

        if (definition.kind !== SHIP_WEAPON_KIND.BEAM_CANNON) {
            throw new Error(
                "Player beamCannon kind does not match definition: " + `${beamCannon.id}/` + `${beamCannon.weaponId}`,
            );
        }

        return definition;
    }
}
