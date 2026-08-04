import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../content/catalogs/ship_weapons';
import {
    LASER_TARGET_ZONES,
    type LaserTargetZone,
} from '../../defs/laser';
import {
    SHIP_WEAPON_PHASE,
    type LaserWeaponDefinition,
    type LaserWeaponState,
} from '../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_TARGET_KIND,
    LASER_SHOT_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type LaserAttackState,
} from '../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import type { EncounterState } from '../model/state';
import EncounterStateStore from '../state/EncounterStateStore';
import CombatRuntimeIdentityFactory from './CombatRuntimeIdentityFactory';

type CombatLaserRunnerOptions = {
    stateStore: EncounterStateStore;
    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
    random: () => number;
    interruptRandomOfficerTask: () => void;
};

// Owns the complete incoming-laser lifecycle: enemy targeting, charging,
// threat state, shield/hull resolution, cooldown and damage interruption.
export default class CombatLaserRunner {
    private readonly stateStore:
        EncounterStateStore;

    private readonly state: EncounterState;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly random:
        () => number;

    private readonly interruptRandomOfficerTask:
        () => void;

    constructor({
        stateStore,
        identities,
        emit,
        random,
        interruptRandomOfficerTask,
    }: CombatLaserRunnerOptions) {
        this.stateStore = stateStore;
        this.identities = identities;
        this.emit = emit;
        this.random = random;
        this.interruptRandomOfficerTask =
            interruptRandomOfficerTask;

        this.state =
            this.stateStore
                .getState();
    }

    public advanceEnemyLaser(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        switch (laser.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return;

            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceTargeting(
                    actor,
                    laser,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                this.advanceCharging(
                    actor,
                    laser,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.COOLDOWN:
                this.advanceCooldown(
                    laser,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHANNELING:
                throw new Error(
                    `Laser cannot enter channeling phase: ` +
                        `${actor.id}/${laser.id}`,
                );

            case SHIP_WEAPON_PHASE.DISPENSING:
                throw new Error(
                    `Laser cannot enter dispensing phase: ` +
                        `${actor.id}/${laser.id}`,
                );
        }
    }

    private advanceTargeting(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            laser.phaseElapsedMs + deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            laser.phaseElapsedMs = elapsedMs;
            return;
        }

        laser.phaseElapsedMs =
            SHIP_WEAPON_TARGETING_DURATION_MS;

        this.startCharging(actor, laser);
    }

    private startCharging(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
    ): void {
        const attack =
            this.createAttack(actor, laser);

        laser.phase =
            SHIP_WEAPON_PHASE.CHARGING;
        laser.phaseElapsedMs = 0;

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .LASER_ATTACK_STARTED,

            attack,
        });
    }

    private advanceCharging(
        actor: ShipEncounterActorState,
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

        this.fire(actor, laser, definition);
    }

    private advanceCooldown(
        laser: LaserWeaponState,
        deltaMs: number,
    ): void {
        const definition =
            this.getDefinition(laser);

        laser.phaseElapsedMs += deltaMs;

        if (
            laser.phaseElapsedMs <
            definition.cooldownDurationMs
        ) {
            return;
        }

        laser.phase =
            SHIP_WEAPON_PHASE.READY;
        laser.phaseElapsedMs = 0;
    }

    private createAttack(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
    ): LaserAttackState {
        const existingAttack =
            this.state.combat
                .laserAttacks
                .find((attack) => {
                    return (
                        attack.sourceActorId ===
                            actor.id &&
                        attack.sourceWeaponId ===
                            laser.id
                    );
                });

        if (existingAttack) {
            throw new Error(
                `Laser weapon already has active attack: ` +
                    `${actor.id}/${laser.id}/${existingAttack.id}`,
            );
        }

        const attack: LaserAttackState = {
            id:
                this.identities
                    .createLaserAttackId(),

            designation:
                this.identities
                    .createThreatDesignation(
                        'L',
                    ),

            sourceActorId: actor.id,
            sourceWeaponId: laser.id,

            target: {
                kind:
                    COMBAT_TARGET_KIND
                        .PLAYER_SHIP,
            },

            targetZone:
                this.selectTargetZone(),

            identification: {
                status:
                    THREAT_IDENTIFICATION_STATUS
                        .UNKNOWN,
            },
        };

        this.state.combat
            .laserAttacks
            .push(attack);

        return attack;
    }

    private fire(
        actor: ShipEncounterActorState,
        laser: LaserWeaponState,
        definition: LaserWeaponDefinition,
    ): void {
        const attackIndex =
            this.state.combat
                .laserAttacks
                .findIndex((attack) => {
                    return (
                        attack.sourceActorId ===
                            actor.id &&
                        attack.sourceWeaponId ===
                            laser.id
                    );
                });

        if (attackIndex < 0) {
            throw new Error(
                `Cannot fire laser without active attack: ` +
                    `${actor.id}/${laser.id}`,
            );
        }

        const attack =
            this.state.combat
                .laserAttacks[attackIndex];

        if (!attack) {
            throw new Error(
                `Laser attack disappeared before fire: ` +
                    `${actor.id}/${laser.id}`,
            );
        }

        this.state.combat
            .laserAttacks
            .splice(attackIndex, 1);

        laser.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        laser.phaseElapsedMs = 0;

        if (this.consumeMatchingShield(attack)) {
            this.emit({
                type:
                    ENCOUNTER_EVENT
                        .LASER_FIRED,

                attack,

                outcome:
                    LASER_SHOT_OUTCOME
                        .BLOCKED,
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
                    .LASER_FIRED,

            attack,

            outcome:
                LASER_SHOT_OUTCOME.HIT,

            ...damageResult,
        });

        this.interruptRandomOfficerTask();
    }

    private consumeMatchingShield(
        attack: LaserAttackState,
    ): boolean {
        const activeShield =
            this.state.combat
                .activeShield;

        if (
            activeShield?.zone !==
            attack.targetZone
        ) {
            return false;
        }

        delete this.state.combat
            .activeShield;

        return true;
    }

    private selectTargetZone(): LaserTargetZone {
        const randomValue = this.random();

        if (
            !Number.isFinite(randomValue) ||
            randomValue < 0 ||
            randomValue >= 1
        ) {
            throw new Error(
                `Combat random source must return a value in [0, 1): ` +
                    `${randomValue}`,
            );
        }

        const index =
            Math.floor(
                randomValue *
                    LASER_TARGET_ZONES.length,
            );

        const targetZone =
            LASER_TARGET_ZONES[index];

        if (!targetZone) {
            throw new Error(
                `Cannot select laser target zone for random value: ` +
                    `${randomValue}`,
            );
        }

        return targetZone;
    }

    private getDefinition(
        laser: LaserWeaponState,
    ): LaserWeaponDefinition {
        const definition =
            SHIP_WEAPONS[laser.weaponId];

        if (
            definition.kind !==
            laser.kind
        ) {
            throw new Error(
                `Laser weapon kind does not match definition: ` +
                    `${laser.id}/${laser.weaponId}`,
            );
        }

        return definition;
    }
}
