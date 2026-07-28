// src/engine/encounter/combat/CombatRunner.ts

import { MISSILES } from '../../content/catalogs/missiles';
import { SHIP_WEAPONS } from '../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../defs/encounter_team';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
    type ShipWeaponDefinition,
    type ShipWeaponState,
} from '../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../actors/ship/ship_encounter_actor';
import { COMBAT_PROJECTILE_KIND, type MissileCombatProjectileState } from '../model/combat';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';

type CombatRunnerOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
};

// Владеет боевым циклом encounter:
//
// - принимает простые решения за enemy ships;
// - управляет lifecycle установленного оружия;
// - создаёт и двигает projectiles;
// - разрешает projectile impacts;
// - эмитит combat events.
//
// Корабли, оружие и projectiles остаются частью EncounterState.
// Статические параметры моделей оружия читаются из content.
export default class CombatRunner {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private nextProjectileId = 1;

    // Общая последовательность коротких обозначений угроз.
    //
    // Позже разные типы смогут использовать
    // собственный prefix при общем номере:
    // M1, M2, L3, M4.
    private nextThreatDesignationNumber = 1;

    constructor({ state, emit }: CombatRunnerOptions) {
        this.state = state;
        this.emit = emit;
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

            this.emit({
                type: ENCOUNTER_EVENT.PLAYER_SHIP_TARGETING_DETECTED,

                sourceActorId: actor.id,
                sourceWeaponId: weapon.id,
            });
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

    private createThreatDesignation(prefix: string): string {
        const designation = `${prefix}${this.nextThreatDesignationNumber}`;

        this.nextThreatDesignationNumber += 1;

        return designation;
    }

    // #endregion
}
