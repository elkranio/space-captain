// src/engine/encounter/combat/EnemyDefenseTurretRunner.ts

import {
    MISSILES,
} from '../../../content/catalogs/missiles';
import {
    DEFENSE_TURRETS,
} from '../../../content/catalogs/defense_turrets';
import {
    DEFENSE_TURRET_PHASE,
    DEFENSE_TURRET_SHOT_OUTCOME,
    type ShipDefenseTurretState,
} from '../../../defs/defense_turret';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type MissileCombatProjectileState,
} from '../../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../../model/event';
import type {
    EncounterState,
} from '../../model/state';

import {
    resolveEnemyDefenseTurretBeamBand,
} from './resolve_enemy_defense_turret_beam_band';

type EnemyDefenseTurretRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    interceptPlayerMissile: (
        projectileId: string,
        targetActorId: string,
    ) => MissileCombatProjectileState;
};

// Owns the physical lifecycle of one installed enemy defense-turret system.
// Policy chooses target and commits a blind fallback band.
// A ready Science report may deterministically override that fallback at shot
// time. Defensive energy is committed by the scheduler when loading
// starts; this runner resolves the band match and advances cooldown.
export default class EnemyDefenseTurretRunner {
    constructor(
        private readonly options:
            EnemyDefenseTurretRunnerOptions,
    ) {}

    public advance(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
        deltaMs: number,
    ): void {
        if (deltaMs < 0) {
            throw new Error(
                'Enemy defense-turret deltaMs cannot be negative: ' +
                    deltaMs,
            );
        }

        switch (defenseTurret.phase) {
            case DEFENSE_TURRET_PHASE.READY:
                return;

            case DEFENSE_TURRET_PHASE.LOADING:
                this.advanceLoading(
                    actor,
                    defenseTurret,
                    deltaMs,
                );
                return;

            case DEFENSE_TURRET_PHASE.COOLDOWN:
                this.advanceCooldown(
                    defenseTurret,
                    deltaMs,
                );
                return;
        }
    }

    private advanceLoading(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
        deltaMs: number,
    ): void {
        const projectile =
            this.findTargetProjectile(
                actor,
                defenseTurret,
            );

        if (!projectile) {
            // Target vanished after commitment.
            // The shared defensive charge remains spent.
            this.resetToReady(
                defenseTurret,
            );

            return;
        }

        const definition =
            DEFENSE_TURRETS[
                defenseTurret.defenseTurretId
            ];

        const elapsedMs =
            defenseTurret.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            definition.loadDurationMs
        ) {
            defenseTurret.phaseElapsedMs =
                elapsedMs;

            return;
        }

        const fallbackBeamBand =
            defenseTurret.loadedBand;

        const powerCore =
            actor.powerCore;

        if (
            !fallbackBeamBand ||
            !powerCore
        ) {
            throw new Error(
                'Enemy defense turret cannot fire: ' +
                    actor.id +
                    '/' +
                    defenseTurret.id,
            );
        }

        const beamBand =
            resolveEnemyDefenseTurretBeamBand({
                observations:
                    actor.threatObservations,
        
                projectileId:
                    projectile.id,
        
                fallbackBeamBand,
            });

        const missile =
            MISSILES[projectile.missileId];

        const outcome =
            beamBand ===
            missile.spectralBand
                ? DEFENSE_TURRET_SHOT_OUTCOME.HIT
                : DEFENSE_TURRET_SHOT_OUTCOME.MISS;

        defenseTurret.phase =
            DEFENSE_TURRET_PHASE.COOLDOWN;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.loadedBand = null;
        defenseTurret.targetProjectileId = null;

        // The shot event precedes missile resolution so presentation can aim
        // at a still-existing projectile. CombatMissileRunner remains the only
        // owner allowed to remove and resolve the projectile.
        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_DEFENSE_TURRET_FIRED,

            sourceActorId: actor.id,
            defenseTurretId:
                defenseTurret.id,

            projectile,

            beamBand,
            outcome,

            remainingCharges:
                powerCore.charges,
        });

        if (
            outcome ===
            DEFENSE_TURRET_SHOT_OUTCOME.HIT
        ) {
            this.options
                .interceptPlayerMissile(
                    projectile.id,
                    actor.id,
                );
        }
    }

    private advanceCooldown(
        defenseTurret: ShipDefenseTurretState,
        deltaMs: number,
    ): void {
        const definition =
            DEFENSE_TURRETS[
                defenseTurret.defenseTurretId
            ];

        defenseTurret.phaseElapsedMs +=
            deltaMs;

        if (
            defenseTurret.phaseElapsedMs <
            definition.cooldownDurationMs
        ) {
            return;
        }

        this.resetToReady(
            defenseTurret,
        );
    }

    private findTargetProjectile(
        actor: ShipEncounterActorState,
        defenseTurret: ShipDefenseTurretState,
    ): MissileCombatProjectileState | undefined {
        const projectileId =
            defenseTurret.targetProjectileId;

        if (!projectileId) {
            return undefined;
        }

        return this.options
            .state
            .combat
            .projectiles
            .find((projectile) => {
                return (
                    projectile.id ===
                        projectileId &&
                    projectile.source.kind ===
                        COMBAT_SOURCE_KIND
                            .PLAYER_SHIP &&
                    projectile.target.kind ===
                        COMBAT_TARGET_KIND
                            .ACTOR &&
                    projectile.target.actorId ===
                        actor.id
                );
            });
    }

    private resetToReady(
        defenseTurret: ShipDefenseTurretState,
    ): void {
        defenseTurret.phase =
            DEFENSE_TURRET_PHASE.READY;
        defenseTurret.phaseElapsedMs = 0;
        defenseTurret.loadedBand = null;
        defenseTurret.targetProjectileId = null;
    }
}
