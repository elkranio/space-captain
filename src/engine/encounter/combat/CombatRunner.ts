// src/engine/encounter/combat/CombatRunner.ts

import { MISSILES } from '../../content/catalogs/missiles';
import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../defs/encounter_team';
import { LASER_TARGET_ZONES, type LaserTargetZone } from '../../defs/laser';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type LaserWeaponState,
    type MissileLauncherState,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_TARGET_KIND,
    THREAT_IDENTIFICATION_STATUS,
    type LaserAttackState,
    type MissileCombatProjectileState,
} from '../model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';

type CombatRunnerOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;

    random: () => number;
};

// Владеет боевым циклом encounter:
//
// - принимает простые решения за enemy ships;
// - управляет lifecycle установленного оружия;
// - создаёт и двигает projectiles;
// - управляет активными laser attacks;
// - разрешает projectile impacts;
// - эмитит combat events.
//
// Корабли, оружие и угрозы остаются частью EncounterState.
// Статические параметры моделей оружия читаются из content.
export default class CombatRunner {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private readonly random: () => number;

    private nextProjectileId = 1;
    private nextLaserAttackId = 1;

    // Общая последовательность коротких обозначений угроз:
    // M1, L2, M3, L4.
    private nextThreatDesignationNumber = 1;

    constructor({ state, emit, random }: CombatRunnerOptions) {
        this.state = state;
        this.emit = emit;
        this.random = random;
    }

    public step(deltaMs: number): void {
        // Существующие projectiles двигаются до оружия,
        // чтобы созданный в этом step projectile
        // не получил тот же deltaMs повторно.
        this.advanceProjectiles(deltaMs);

        this.startEnemyWeaponPreparation();
        this.advanceWeapons(deltaMs);
    }

    // #region Enemy decisions

    private startEnemyWeaponPreparation(): void {
        const navigation = this.state.navigation;

        if (navigation.kind !== PLAYER_SPACE_NAVIGATION_KIND.ANCHORED) {
            return;
        }

        for (const actor of this.state.actors) {
            if (actor.team !== ENCOUNTER_TEAM.ENEMY) {
                continue;
            }

            if (actor.anchorId !== navigation.anchorId) {
                continue;
            }

            if (this.hasPreparingWeapon(actor)) {
                continue;
            }

            const weapon = actor.weapons.find((candidate) => {
                return this.canPrepareWeapon(candidate);
            });

            if (!weapon) {
                continue;
            }

            weapon.phase = SHIP_WEAPON_PHASE.PREPARING;
            weapon.phaseElapsedMs = 0;

            const laserAttack =
                weapon.kind === SHIP_WEAPON_KIND.LASER
                    ? this.createLaserAttack(actor, weapon)
                    : undefined;

            this.emit({
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId: weapon.id,
            });

            if (laserAttack) {
                this.emit({
                    type: ENCOUNTER_EVENT.LASER_ATTACK_STARTED,

                    attack: this.cloneLaserAttack(laserAttack),
                });
            }
        }
    }

    private hasPreparingWeapon(actor: ShipEncounterActorState): boolean {
        return actor.weapons.some((weapon) => {
            return weapon.phase === SHIP_WEAPON_PHASE.PREPARING;
        });
    }

    private canPrepareWeapon(weapon: ShipWeaponState): boolean {
        if (weapon.phase !== SHIP_WEAPON_PHASE.READY) {
            return false;
        }

        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                return weapon.loadedMissileId !== null && weapon.ammoCount > 0;

            case SHIP_WEAPON_KIND.LASER:
                return true;
        }
    }

    // #endregion

    // #region Weapon lifecycle

    private advanceWeapons(deltaMs: number): void {
        for (const actor of this.state.actors) {
            for (const weapon of actor.weapons) {
                const definition = this.getWeaponDefinition(weapon);

                switch (weapon.phase) {
                    case SHIP_WEAPON_PHASE.READY:
                        break;

                    case SHIP_WEAPON_PHASE.PREPARING:
                        this.advancePreparingWeapon(actor, weapon, definition, deltaMs);
                        break;

                    case SHIP_WEAPON_PHASE.COOLDOWN:
                        this.advanceWeaponCooldown(weapon, definition, deltaMs);
                        break;
                }
            }
        }
    }

    private advancePreparingWeapon(
        actor: ShipEncounterActorState,
        weapon: ShipWeaponState,
        definition: ShipWeaponDefinition,
        deltaMs: number,
    ): void {
        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < definition.preparationDurationMs) {
            return;
        }

        this.activateWeapon(actor, weapon);
    }

    private activateWeapon(actor: ShipEncounterActorState, weapon: ShipWeaponState): void {
        switch (weapon.kind) {
            case SHIP_WEAPON_KIND.MISSILE_LAUNCHER:
                this.launchMissile(actor, weapon);
                return;

            case SHIP_WEAPON_KIND.LASER:
                this.fireLaser(actor, weapon);
                return;
        }
    }

    private advanceWeaponCooldown(weapon: ShipWeaponState, definition: ShipWeaponDefinition, deltaMs: number): void {
        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < definition.cooldownDurationMs) {
            return;
        }

        weapon.phase = SHIP_WEAPON_PHASE.READY;
        weapon.phaseElapsedMs = 0;
    }

    private getWeaponDefinition(weapon: ShipWeaponState): ShipWeaponDefinition {
        const definition = SHIP_WEAPONS[weapon.weaponId];

        if (definition.kind !== weapon.kind) {
            throw new Error(`Ship weapon kind does not match definition: ` + `${weapon.id}/${weapon.weaponId}`);
        }

        return definition;
    }

    // #endregion

    // #region Missile launcher

    private launchMissile(actor: ShipEncounterActorState, launcher: MissileLauncherState): void {
        const missileId = launcher.loadedMissileId;

        if (!missileId || launcher.ammoCount <= 0) {
            throw new Error(`Cannot launch missile from empty launcher: ` + `${actor.id}/${launcher.id}`);
        }

        const missile = MISSILES[missileId];

        launcher.ammoCount -= 1;
        launcher.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        launcher.phaseElapsedMs = 0;

        const projectile: MissileCombatProjectileState = {
            id: this.createProjectileId(),
            designation: this.createThreatDesignation('M'),

            kind: COMBAT_PROJECTILE_KIND.MISSILE,

            sourceActorId: actor.id,
            sourceWeaponId: launcher.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },

            missileId,

            timeToImpactMs: missile.flightDurationMs,
            initialTimeToImpactMs: missile.flightDurationMs,
        };

        this.state.combat.projectiles.push(projectile);

        this.emit({
            type: ENCOUNTER_EVENT.MISSILE_LAUNCHED,

            projectile: {
                ...projectile,
            },
        });
    }

    // #endregion

    // #region Laser

    private createLaserAttack(actor: ShipEncounterActorState, laser: LaserWeaponState): LaserAttackState {
        const existingAttack = this.state.combat.laserAttacks.find((attack) => {
            return attack.sourceActorId === actor.id && attack.sourceWeaponId === laser.id;
        });

        if (existingAttack) {
            throw new Error(`Laser weapon already has active attack: ` + `${actor.id}/${laser.id}/${existingAttack.id}`);
        }

        const attack: LaserAttackState = {
            id: this.createLaserAttackId(),
            designation: this.createThreatDesignation('L'),

            sourceActorId: actor.id,
            sourceWeaponId: laser.id,

            target: {
                kind: COMBAT_TARGET_KIND.PLAYER_SHIP,
            },

            targetZone: this.selectLaserTargetZone(),

            identification: {
                status: THREAT_IDENTIFICATION_STATUS.UNKNOWN,
            },
        };

        this.state.combat.laserAttacks.push(attack);

        return attack;
    }

    private fireLaser(actor: ShipEncounterActorState, laser: LaserWeaponState): void {
        const attackIndex = this.state.combat.laserAttacks.findIndex((attack) => {
            return attack.sourceActorId === actor.id && attack.sourceWeaponId === laser.id;
        });

        if (attackIndex < 0) {
            throw new Error(`Cannot fire laser without active attack: ` + `${actor.id}/${laser.id}`);
        }

        const attack = this.state.combat.laserAttacks[attackIndex];
        const attackSnapshot = this.cloneLaserAttack(attack);

        this.state.combat.laserAttacks.splice(attackIndex, 1);

        laser.phase = SHIP_WEAPON_PHASE.COOLDOWN;
        laser.phaseElapsedMs = 0;

        this.emit({
            type: ENCOUNTER_EVENT.LASER_FIRED,

            attack: attackSnapshot,
        });
    }

    private selectLaserTargetZone(): LaserTargetZone {
        const randomValue = this.random();

        if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
            throw new Error(`Combat random source must return a value in [0, 1): ${randomValue}`);
        }

        const index = Math.floor(randomValue * LASER_TARGET_ZONES.length);
        const targetZone = LASER_TARGET_ZONES[index];

        if (!targetZone) {
            throw new Error(`Cannot select laser target zone for random value: ${randomValue}`);
        }

        return targetZone;
    }

    private cloneLaserAttack(attack: LaserAttackState): LaserAttackState {
        return {
            ...attack,

            target: {
                ...attack.target,
            },

            identification: {
                ...attack.identification,
            },
        };
    }

    // #endregion

    // #region Projectiles

    private advanceProjectiles(deltaMs: number): void {
        // Идём с конца, потому что impacted projectiles
        // удаляются из массива во время обхода.
        for (let index = this.state.combat.projectiles.length - 1; index >= 0; index -= 1) {
            const projectile = this.state.combat.projectiles[index];

            projectile.timeToImpactMs = Math.max(0, projectile.timeToImpactMs - deltaMs);

            if (projectile.timeToImpactMs > 0) {
                continue;
            }

            this.resolveMissileImpact(index, projectile);
        }
    }

    private resolveMissileImpact(index: number, projectile: MissileCombatProjectileState): void {
        if (projectile.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            throw new Error(
                `Cannot resolve missile impact for unsupported target: ` + `${projectile.id}/${projectile.target.kind}`,
            );
        }

        const missile = MISSILES[projectile.missileId];

        const projectileSnapshot: MissileCombatProjectileState = {
            ...projectile,

            timeToImpactMs: 0,
        };

        this.state.combat.projectiles.splice(index, 1);

        this.emit({
            type: ENCOUNTER_EVENT.MISSILE_IMPACTED_PLAYER_SHIP,

            projectile: projectileSnapshot,

            damage: missile.damage,
        });
    }

    // #endregion

    // #region Runtime identities

    private createProjectileId(): string {
        const id = `projectile_${this.nextProjectileId}`;

        this.nextProjectileId += 1;

        return id;
    }

    private createLaserAttackId(): string {
        const id = `laser_attack_${this.nextLaserAttackId}`;

        this.nextLaserAttackId += 1;

        return id;
    }

    private createThreatDesignation(prefix: string): string {
        const designation = `${prefix}${this.nextThreatDesignationNumber}`;

        this.nextThreatDesignationNumber += 1;

        return designation;
    }

    // #endregion
}
