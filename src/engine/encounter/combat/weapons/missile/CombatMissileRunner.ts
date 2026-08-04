// src/engine/encounter/combat/CombatMissileRunner.ts

import { MISSILES } from '../../../../content/catalogs/missiles';
import {
    SHIP_WEAPONS,
    SHIP_WEAPON_TARGETING_DURATION_MS,
} from '../../../../content/catalogs/ship_weapons';
import { ENCOUNTER_TEAM } from '../../../../defs/encounter_team';
import type { MissileId } from '../../../../defs/missile';
import {
    SHIP_WEAPON_KIND,
    SHIP_WEAPON_PHASE,
    type MissileLauncherDefinition,
    type MissileLauncherState,
} from '../../../../defs/ship_weapon';
import type { ShipEncounterActorState } from '../../../actors/ship/ship_encounter_actor';
import {
    COMBAT_PROJECTILE_KIND,
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    PLAYER_MISSILE_OUTCOME,
    THREAT_IDENTIFICATION_STATUS,
    type MissileCombatProjectileState,
} from '../../../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../../model/event';
import type { EncounterState } from '../../../model/state';
import EncounterStateStore from '../../../state/EncounterStateStore';
import CombatRuntimeIdentityFactory from '../../CombatRuntimeIdentityFactory';

export type PlayerMissileLaunchInput = {
    sourceWeaponId: string;
    missileId: MissileId;
    targetActorId: string;
};

type CombatMissileRunnerOptions = {
    stateStore: EncounterStateStore;
    identities: CombatRuntimeIdentityFactory;
    emit: (event: EncounterEvent) => void;
    destroyEnemyActor: (actorId: string) => void;
};

// Owns the complete missile lifecycle for both combat directions:
// queued player launches, enemy launches, flight, impact, target loss and
// target cleanup and enemy launcher phases. CombatRunner owns only the locked
// top-level phase order and concrete-family dispatch.
export default class CombatMissileRunner {
    private readonly state: EncounterState;

    private readonly stateStore:
        EncounterStateStore;

    private readonly identities:
        CombatRuntimeIdentityFactory;

    private readonly emit:
        (event: EncounterEvent) => void;

    private readonly destroyEnemyActor:
        (actorId: string) => void;

    private readonly pendingPlayerLaunches:
        PlayerMissileLaunchInput[] = [];

    constructor({
        stateStore,
        identities,
        emit,
        destroyEnemyActor,
    }: CombatMissileRunnerOptions) {
        this.stateStore = stateStore;
        this.identities = identities;
        this.emit = emit;
        this.destroyEnemyActor =
            destroyEnemyActor;

        this.state =
            this.stateStore
                .getState();
    }

    public captureExistingProjectileIds(): string[] {
        return this.state.combat
            .projectiles
            .map((projectile) => {
                return projectile.id;
            })
            .reverse();
    }

    public queuePlayerLaunch(
        input: PlayerMissileLaunchInput,
    ): void {
        this.pendingPlayerLaunches.push({
            ...input,
        });
    }

    public integratePendingPlayerLaunches(): void {
        const launches =
            this.pendingPlayerLaunches
                .splice(0);

        for (const launch of launches) {
            this.createPlayerProjectile(
                launch,
            );
        }
    }

    public advanceEnemyLauncher(
        actor: ShipEncounterActorState,
        launcher: MissileLauncherState,
        deltaMs: number,
    ): void {
        switch (launcher.phase) {
            case SHIP_WEAPON_PHASE.READY:
                return;

            case SHIP_WEAPON_PHASE.TARGETING:
                this.advanceTargeting(
                    actor,
                    launcher,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.COOLDOWN:
                this.advanceCooldown(
                    launcher,
                    deltaMs,
                );
                return;

            case SHIP_WEAPON_PHASE.CHARGING:
                throw new Error(
                    `Missile launcher cannot enter charging phase: ` +
                        `${actor.id}/${launcher.id}`,
                );

            case SHIP_WEAPON_PHASE.CHANNELING:
                throw new Error(
                    `Missile launcher cannot enter channeling phase: ` +
                        `${actor.id}/${launcher.id}`,
                );

            case SHIP_WEAPON_PHASE.DISPENSING:
                throw new Error(
                    `Missile launcher cannot enter dispensing phase: ` +
                        `${actor.id}/${launcher.id}`,
                );
        }
    }

    private launchEnemyMissile(
        actor: ShipEncounterActorState,
        launcher: MissileLauncherState,
    ): void {
        const missileId =
            launcher.loadedMissileId;

        if (
            !missileId ||
            launcher.ammoCount <= 0
        ) {
            throw new Error(
                `Cannot launch missile from empty launcher: ` +
                    `${actor.id}/${launcher.id}`,
            );
        }

        const missile = MISSILES[missileId];

        launcher.ammoCount -= 1;
        launcher.phase =
            SHIP_WEAPON_PHASE.COOLDOWN;
        launcher.phaseElapsedMs = 0;

        const projectile:
            MissileCombatProjectileState = {
                id:
                    this.identities
                        .createProjectileId(),

                designation:
                    this.identities
                        .createThreatDesignation(
                            'M',
                        ),

                kind:
                    COMBAT_PROJECTILE_KIND
                        .MISSILE,

                source: {
                    kind:
                        COMBAT_SOURCE_KIND.ACTOR,

                    actorId: actor.id,
                },

                sourceWeaponId:
                    launcher.id,

                target: {
                    kind:
                        COMBAT_TARGET_KIND
                            .PLAYER_SHIP,
                },

                identification: {
                    status:
                        THREAT_IDENTIFICATION_STATUS
                            .UNKNOWN,
                },

                missileId,

                timeToImpactMs:
                    missile.flightDurationMs,

                initialTimeToImpactMs:
                    missile.flightDurationMs,
            };

        this.state.combat
            .projectiles
            .push(projectile);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .MISSILE_LAUNCHED,

            projectile,
        });
    }

    public advanceExistingProjectiles(
        projectileIds: readonly string[],
        deltaMs: number,
    ): void {
        for (
            const projectileId of
            projectileIds
        ) {
            const index =
                this.state.combat
                    .projectiles
                    .findIndex(
                        (projectile) => {
                            return (
                                projectile.id ===
                                projectileId
                            );
                        },
                    );

            // A previous lethal resolution may have removed this projectile
            // during the same combat step.
            if (index < 0) {
                continue;
            }

            const projectile =
                this.state.combat
                    .projectiles[index];

            if (
                projectile.target.kind ===
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP
            ) {
                this.advanceIncomingMissile(
                    index,
                    projectile,
                    deltaMs,
                );

                continue;
            }

            this.advancePlayerMissile(
                index,
                projectile,
                projectile.target.actorId,
                deltaMs,
            );
        }
    }

    public removePlayerMissilesTargetingActor(
        actorId: string,
    ): void {
        for (
            let index =
                this.state.combat
                    .projectiles.length - 1;

            index >= 0;

            index -= 1
        ) {
            const projectile =
                this.state.combat
                    .projectiles[index];

            if (
                projectile.source.kind !==
                    COMBAT_SOURCE_KIND
                        .PLAYER_SHIP ||
                projectile.target.kind !==
                    COMBAT_TARGET_KIND.ACTOR ||
                projectile.target.actorId !==
                    actorId
            ) {
                continue;
            }

            this.resolvePlayerMissileTargetLost(
                index,
                projectile,
            );
        }
    }

    public interceptPlayerMissile(
        projectileId: string,
        targetActorId: string,
    ): MissileCombatProjectileState {
        const index =
            this.state
                .combat
                .projectiles
                .findIndex((projectile) => {
                    return (
                        projectile.id ===
                        projectileId
                    );
                });

        const projectile =
            this.state
                .combat
                .projectiles[index];

        if (
            index < 0 ||
            !projectile ||
            projectile.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR ||
            projectile.target.actorId !==
                targetActorId
        ) {
            throw new Error(
                'Cannot intercept player missile: ' +
                    targetActorId +
                    '/' +
                    projectileId,
            );
        }

        this.state.combat
            .projectiles
            .splice(index, 1);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile,

            outcome:
                PLAYER_MISSILE_OUTCOME
                    .INTERCEPTED,
        });

        return projectile;
    }

    private advanceTargeting(
        actor: ShipEncounterActorState,
        launcher: MissileLauncherState,
        deltaMs: number,
    ): void {
        const elapsedMs =
            launcher.phaseElapsedMs + deltaMs;

        if (
            elapsedMs <
            SHIP_WEAPON_TARGETING_DURATION_MS
        ) {
            launcher.phaseElapsedMs = elapsedMs;
            return;
        }

        launcher.phaseElapsedMs =
            SHIP_WEAPON_TARGETING_DURATION_MS;

        this.launchEnemyMissile(
            actor,
            launcher,
        );
    }

    private advanceCooldown(
        launcher: MissileLauncherState,
        deltaMs: number,
    ): void {
        const definition =
            this.getLauncherDefinition(
                launcher,
            );

        launcher.phaseElapsedMs += deltaMs;

        if (
            launcher.phaseElapsedMs <
            definition.cooldownDurationMs
        ) {
            return;
        }

        launcher.phase =
            SHIP_WEAPON_PHASE.READY;
        launcher.phaseElapsedMs = 0;
    }

    private getLauncherDefinition(
        launcher: MissileLauncherState,
    ): MissileLauncherDefinition {
        const definition =
            SHIP_WEAPONS[launcher.weaponId];

        if (
            definition.kind !==
            SHIP_WEAPON_KIND
                .MISSILE_LAUNCHER
        ) {
            throw new Error(
                `Missile launcher kind does not match definition: ` +
                    `${launcher.id}/${launcher.weaponId}`,
            );
        }

        return definition;
    }

    private createPlayerProjectile(
        launch: PlayerMissileLaunchInput,
    ): void {
        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        launch.targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            throw new Error(
                'Cannot launch player missile ' +
                    'at invalid target: ' +
                    `${launch.sourceWeaponId}/` +
                    `${launch.targetActorId}`,
            );
        }

        const missile =
            MISSILES[launch.missileId];

        const projectile:
            MissileCombatProjectileState = {
                id:
                    this.identities
                        .createProjectileId(),

                designation:
                    this.identities
                        .createThreatDesignation(
                            'M',
                        ),

                kind:
                    COMBAT_PROJECTILE_KIND
                        .MISSILE,

                source: {
                    kind:
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP,
                },

                sourceWeaponId:
                    launch.sourceWeaponId,

                target: {
                    kind:
                        COMBAT_TARGET_KIND.ACTOR,

                    actorId:
                        launch.targetActorId,
                },

                identification: {
                    status:
                        THREAT_IDENTIFICATION_STATUS
                            .IDENTIFIED,

                    spectralBand:
                        missile.spectralBand,
                },

                missileId:
                    launch.missileId,

                timeToImpactMs:
                    missile.flightDurationMs,

                initialTimeToImpactMs:
                    missile.flightDurationMs,
            };

        this.state.combat
            .projectiles
            .push(projectile);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_LAUNCHED,

            projectile,
        });
    }

    private advanceIncomingMissile(
        index: number,
        projectile:
            MissileCombatProjectileState,
        deltaMs: number,
    ): void {
        projectile.timeToImpactMs =
            Math.max(
                0,
                projectile.timeToImpactMs -
                    deltaMs,
            );

        if (
            projectile.timeToImpactMs >
            0
        ) {
            return;
        }

        this.resolveMissileImpactOnPlayerShip(
            index,
            projectile,
        );
    }

    private advancePlayerMissile(
        index: number,
        projectile:
            MissileCombatProjectileState,
        targetActorId: string,
        deltaMs: number,
    ): void {
        if (
            projectile.source.kind !==
            COMBAT_SOURCE_KIND.PLAYER_SHIP
        ) {
            throw new Error(
                'Actor-target missile has ' +
                    'unsupported source: ' +
                    `${projectile.id}/` +
                    `${projectile.source.kind}`,
            );
        }

        const target =
            this.state.actors.find(
                (actor) => {
                    return (
                        actor.id ===
                        targetActorId
                    );
                },
            );

        if (
            !target ||
            target.team !==
                ENCOUNTER_TEAM.ENEMY ||
            target.hull <= 0
        ) {
            this.resolvePlayerMissileTargetLost(
                index,
                projectile,
            );

            return;
        }

        projectile.timeToImpactMs =
            Math.max(
                0,
                projectile.timeToImpactMs -
                    deltaMs,
            );

        if (
            projectile.timeToImpactMs >
            0
        ) {
            return;
        }

        this.resolvePlayerMissileImpact(
            index,
            projectile,
            target,
        );
    }

    private resolvePlayerMissileTargetLost(
        index: number,
        projectile:
            MissileCombatProjectileState,
    ): void {
        if (
            projectile.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            projectile.target.kind !==
                COMBAT_TARGET_KIND.ACTOR
        ) {
            throw new Error(
                'Cannot resolve player missile target loss for route: ' +
                    projectile.id +
                    '/' +
                    projectile.source.kind +
                    '/' +
                    projectile.target.kind,
            );
        }

        this.state.combat
            .projectiles
            .splice(index, 1);

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile,

            outcome:
                PLAYER_MISSILE_OUTCOME
                    .TARGET_LOST,
        });
    }

    private resolveMissileImpactOnPlayerShip(
        index: number,
        projectile:
            MissileCombatProjectileState,
    ): void {
        if (
            projectile.target.kind !==
                COMBAT_TARGET_KIND
                    .PLAYER_SHIP
        ) {
            throw new Error(
                'Cannot resolve incoming missile ' +
                    'impact for target: ' +
                    `${projectile.id}/` +
                    `${projectile.target.kind}`,
            );
        }

        const missile =
            MISSILES[projectile.missileId];

        projectile.timeToImpactMs = 0;

        this.state.combat
            .projectiles
            .splice(index, 1);

        const damageResult =
            this.stateStore
                .damagePlayerHull(
                    missile.damage,
                );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .MISSILE_IMPACTED_PLAYER_SHIP,

            projectile,

            ...damageResult,
        });
    }

    private resolvePlayerMissileImpact(
        index: number,
        projectile:
            MissileCombatProjectileState,
        target:
            ShipEncounterActorState,
    ): void {
        const missile =
            MISSILES[projectile.missileId];

        projectile.timeToImpactMs = 0;

        this.state.combat
            .projectiles
            .splice(index, 1);

        const damageResult =
            this.stateStore
                .damageEnemyActorHull(
                    target.id,
                    missile.damage,
                );

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_MISSILE_RESOLVED,

            projectile,

            outcome:
                PLAYER_MISSILE_OUTCOME.HIT,

            damage:
                damageResult.appliedDamage,

            remainingHull:
                damageResult.remainingHull,
        });

        if (damageResult.destroyed) {
            this.destroyEnemyActor(
                target.id,
            );
        }
    }
}
