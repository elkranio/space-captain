import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../../content/catalogs/ship_weapons';
import {
    SHIP_WEAPON_PHASE,
    type BeamCannonDefinition,
    type BeamCannonState,
} from '../../../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../../../actors/ship/ship_encounter_actor';
import {
    COMBAT_TARGET_KIND,
    BEAM_CANNON_SHOT_OUTCOME,
    type BeamCannonAttackState,
} from '../../../model/combat';
import {
    ENCOUNTER_EVENT,
    PLAYER_SHIELD_END_OUTCOME,
    type EncounterEvent,
} from '../../../model/event';
import type { EncounterState } from '../../../model/state';
import EncounterStateStore from '../../../state/EncounterStateStore';
import CombatRuntimeIdentityFactory from '../../CombatRuntimeIdentityFactory';

type CombatBeamCannonRunnerOptions = {
    stateStore: EncounterStateStore;
    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
    interruptRandomOfficerTask: () => void;
};

// Owns the complete incoming-beamCannon lifecycle: enemy targeting, charging,
// threat state, hull resolution, cooldown and damage interruption.
export default class CombatBeamCannonRunner {
    private readonly stateStore:
        EncounterStateStore;

    private readonly state: EncounterState;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly interruptRandomOfficerTask:
        () => void;

    constructor({
        stateStore,
        identities,
        emit,
        interruptRandomOfficerTask,
    }: CombatBeamCannonRunnerOptions) {
        this.stateStore = stateStore;
        this.identities = identities;
        this.emit = emit;
        this.interruptRandomOfficerTask =
            interruptRandomOfficerTask;

        this.state =
            this.stateStore
                .getState();
    }

    public advanceEnemyBeamCannon(
        actor: ShipEncounterActorState,
        beamCannon: BeamCannonState,
        deltaMs: number,
    ): void {
        switch (beamCannon.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return;

            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceTargeting(
                    actor,
                    beamCannon,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                this.advanceCharging(
                    actor,
                    beamCannon,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.COOLDOWN:
                this.advanceCooldown(
                    beamCannon,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHANNELING:
                throw new Error(
                    `BeamCannon cannot enter channeling phase: ` +
                        `${actor.id}/${beamCannon.id}`,
                );

            case SHIP_WEAPON_PHASE.DISPENSING:
                throw new Error(
                    `BeamCannon cannot enter dispensing phase: ` +
                        `${actor.id}/${beamCannon.id}`,
                );
        }
    }

    private advanceTargeting(
        actor: ShipEncounterActorState,
        beamCannon: BeamCannonState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            beamCannon.phaseElapsedMs + deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            beamCannon.phaseElapsedMs = elapsedMs;
            return;
        }

        beamCannon.phaseElapsedMs =
            SHIP_WEAPON_TARGETING_DURATION_MS;

        this.startCharging(actor, beamCannon);
    }

    private startCharging(
        actor: ShipEncounterActorState,
        beamCannon: BeamCannonState,
    ): void {
        const attack =
            this.createAttack(actor, beamCannon);

        beamCannon.phase =
            SHIP_WEAPON_PHASE.CHARGING;
        beamCannon.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .BEAM_CANNON_ATTACK_STARTED,

            attack,
        });
    }

    private advanceCharging(
        actor: ShipEncounterActorState,
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

        this.fire(actor, beamCannon, definition);
    }

    private advanceCooldown(
        beamCannon: BeamCannonState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDefinition(beamCannon);

        beamCannon.phaseElapsedMs += deltaMs;

        if (
            beamCannon.phaseElapsedMs <
            definition.cooldownDurationMs
        ) {
            return;
        }

        beamCannon.phase =
            SHIP_WEAPON_PHASE.READY;
        beamCannon.phaseElapsedMs = 0;
    }

    private createAttack(
        actor: ShipEncounterActorState,
        beamCannon: BeamCannonState,
    ): BeamCannonAttackState {
        const existingAttack =
            this.state.combat
                .beamCannonAttacks
                .find((attack) => {
                    return (
                        attack.sourceActorId ===
                            actor.id &&
                        attack.sourceWeaponId ===
                            beamCannon.id
                    );
                });

        if (existingAttack) {
            throw new Error(
                `BeamCannon weapon already has active attack: ` +
                    `${actor.id}/${beamCannon.id}/${existingAttack.id}`,
            );
        }

        const attack: BeamCannonAttackState = {
            id:
                this.identities
                    .createBeamCannonAttackId(),

            designation:
                this.identities
                    .createThreatDesignation(
                        'L',
                    ),

            sourceActorId: actor.id,
            sourceWeaponId: beamCannon.id,

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .PLAYER_SHIP,
            },

        };

        this.state.combat
            .beamCannonAttacks
            .push(attack);

        return attack;
    }

    private fire(
        actor: ShipEncounterActorState,
        beamCannon: BeamCannonState,
        definition: BeamCannonDefinition,
    ): void {
        const attackIndex =
            this.state.combat
                .beamCannonAttacks
                .findIndex((attack) => {
                    return (
                        attack.sourceActorId ===
                            actor.id &&
                        attack.sourceWeaponId ===
                            beamCannon.id
                    );
                });

        if (attackIndex < 0) {
            throw new Error(
                `Cannot fire beamCannon without active attack: ` +
                    `${actor.id}/${beamCannon.id}`,
            );
        }

        const attack =
            this.state.combat
                .beamCannonAttacks[attackIndex];

        if (!attack) {
            throw new Error(
                `BeamCannon attack disappeared before fire: ` +
                    `${actor.id}/${beamCannon.id}`,
            );
        }

        this.state.combat
            .beamCannonAttacks
            .splice(attackIndex, 1);

        beamCannon.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        beamCannon.phaseElapsedMs = 0;


        const absorbedByShield =
            this.stateStore
                .consumeActiveShield();

        if (absorbedByShield) {
            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .BEAM_CANNON_FIRED,

                attack,

                outcome:
                    BEAM_CANNON_SHOT_OUTCOME
                        .ABSORBED,
            });

            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .PLAYER_SHIELD_ENDED,

                shield:
                    absorbedByShield,

                outcome:
                    PLAYER_SHIELD_END_OUTCOME
                        .ABSORBED,
            });

            return;
        }

        const damageResult =
            this.stateStore
                .damagePlayerHull(
                    definition.damage,
                );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .BEAM_CANNON_FIRED,

            attack,

            outcome:
                BEAM_CANNON_SHOT_OUTCOME.HIT,

            ...damageResult,
        });

        this.interruptRandomOfficerTask();
    }

    private getDefinition(
        beamCannon: BeamCannonState,
    ): BeamCannonDefinition {
        const definition =
            SHIP_WEAPONS[beamCannon.weaponId];

        if (
            definition.kind !==
            beamCannon.kind
        ) {
            throw new Error(
                `BeamCannon weapon kind does not match definition: ` +
                    `${beamCannon.id}/${beamCannon.weaponId}`,
            );
        }

        return definition;
    }
}
