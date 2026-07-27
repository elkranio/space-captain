// src/engine/encounter/combat/CombatRunner.ts

import { MISSILES } from '../../content/missiles';
import { ENCOUNTER_TEAM } from '../../defs/encounter_team';
import { PLAYER_SPACE_NAVIGATION_KIND } from '../../defs/player_location';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherState,
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
// - создаёт projectiles;
// - эмитит combat events.
//
// Корабли, оружие и projectiles остаются частью EncounterState.
// Отдельных копий units внутри runner нет.
export default class CombatRunner {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    private nextProjectileId = 1;

    constructor({ state, emit }: CombatRunnerOptions) {
        this.state = state;
        this.emit = emit;
    }

    public step(deltaMs: number): void {
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
                switch (weapon.phase) {
                    case SHIP_WEAPON_PHASE.READY:
                        break;

                    case SHIP_WEAPON_PHASE.PREPARING:
                        this.advancePreparingWeapon(actor, weapon, deltaMs);
                        break;

                    case SHIP_WEAPON_PHASE.COOLDOWN:
                        this.advanceWeaponCooldown(weapon, deltaMs);
                        break;
                }
            }
        }
    }

    private advancePreparingWeapon(actor: ShipEncounterActorState, weapon: ShipWeaponState, deltaMs: number): void {
        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < weapon.preparationDurationMs) {
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

    private advanceWeaponCooldown(weapon: ShipWeaponState, deltaMs: number): void {
        weapon.phaseElapsedMs += deltaMs;

        if (weapon.phaseElapsedMs < weapon.cooldownDurationMs) {
            return;
        }

        weapon.phase = SHIP_WEAPON_PHASE.READY;
        weapon.phaseElapsedMs = 0;
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

    private createProjectileId(): string {
        const id = `projectile_${this.nextProjectileId}`;

        this.nextProjectileId += 1;

        return id;
    }

    // #endregion
}
