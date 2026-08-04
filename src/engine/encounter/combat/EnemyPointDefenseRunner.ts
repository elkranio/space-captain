// src/engine/encounter/combat/EnemyPointDefenseRunner.ts

import {
    MISSILES,
} from '../../content/catalogs/missiles';
import {
    POINT_DEFENSES,
} from '../../content/catalogs/point_defenses';
import {
    POINT_DEFENSE_PHASE,
    POINT_DEFENSE_SHOT_OUTCOME,
    type ShipPointDefenseState,
} from '../../defs/point_defense';
import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
    type MissileCombatProjectileState,
} from '../model/combat';
import {
    ENCOUNTER_EVENT,
    type EncounterEvent,
} from '../model/event';
import type {
    EncounterState,
} from '../model/state';

type EnemyPointDefenseRunnerOptions = {
    state: EncounterState;

    emit: (event: EncounterEvent) => void;

    interceptPlayerMissile: (
        projectileId: string,
        targetActorId: string,
    ) => MissileCombatProjectileState;
};

// Owns the physical lifecycle of one installed enemy point-defense system.
// Policy chooses target and beam band. This runner only loads, resolves the
// deterministic band match, spends a charge and advances cooldown.
export default class EnemyPointDefenseRunner {
    constructor(
        private readonly options:
            EnemyPointDefenseRunnerOptions,
    ) {}

    public advance(
        actor: ShipEncounterActorState,
        pointDefense: ShipPointDefenseState,
        deltaMs: number,
    ): void {
        if (deltaMs < 0) {
            throw new Error(
                'Enemy point-defense deltaMs cannot be negative: ' +
                    deltaMs,
            );
        }

        switch (pointDefense.phase) {
            case POINT_DEFENSE_PHASE.READY:
                return;

            case POINT_DEFENSE_PHASE.LOADING:
                this.advanceLoading(
                    actor,
                    pointDefense,
                    deltaMs,
                );
                return;

            case POINT_DEFENSE_PHASE.COOLDOWN:
                this.advanceCooldown(
                    pointDefense,
                    deltaMs,
                );
                return;
        }
    }

    private advanceLoading(
        actor: ShipEncounterActorState,
        pointDefense: ShipPointDefenseState,
        deltaMs: number,
    ): void {
        const projectile =
            this.findTargetProjectile(
                actor,
                pointDefense,
            );

        if (!projectile) {
            // Target vanished before the shot. No charge is spent.
            this.resetToReady(
                pointDefense,
            );

            return;
        }

        const definition =
            POINT_DEFENSES[
                pointDefense.pointDefenseId
            ];

        const elapsedMs =
            pointDefense.phaseElapsedMs +
            deltaMs;

        if (
            elapsedMs <
            definition.loadDurationMs
        ) {
            pointDefense.phaseElapsedMs =
                elapsedMs;

            return;
        }

        const beamBand =
            pointDefense.loadedBand;

        if (
            !beamBand ||
            pointDefense.charges <= 0
        ) {
            throw new Error(
                'Enemy point defense cannot fire: ' +
                    actor.id +
                    '/' +
                    pointDefense.id,
            );
        }

        const missile =
            MISSILES[projectile.missileId];

        const outcome =
            beamBand ===
            missile.spectralBand
                ? POINT_DEFENSE_SHOT_OUTCOME.HIT
                : POINT_DEFENSE_SHOT_OUTCOME.MISS;

        pointDefense.charges -= 1;
        pointDefense.phase =
            POINT_DEFENSE_PHASE.COOLDOWN;
        pointDefense.phaseElapsedMs = 0;
        pointDefense.loadedBand = null;
        pointDefense.targetProjectileId = null;

        // The shot event precedes missile resolution so presentation can aim
        // at a still-existing projectile. CombatMissileRunner remains the only
        // owner allowed to remove and resolve the projectile.
        this.options.emit({
            type:
                ENCOUNTER_EVENT
                    .ENEMY_POINT_DEFENSE_FIRED,

            sourceActorId: actor.id,
            pointDefenseId:
                pointDefense.id,

            projectile,

            beamBand,
            outcome,

            remainingCharges:
                pointDefense.charges,
        });

        if (
            outcome ===
            POINT_DEFENSE_SHOT_OUTCOME.HIT
        ) {
            this.options
                .interceptPlayerMissile(
                    projectile.id,
                    actor.id,
                );
        }
    }

    private advanceCooldown(
        pointDefense: ShipPointDefenseState,
        deltaMs: number,
    ): void {
        const definition =
            POINT_DEFENSES[
                pointDefense.pointDefenseId
            ];

        pointDefense.phaseElapsedMs +=
            deltaMs;

        if (
            pointDefense.phaseElapsedMs <
            definition.cooldownDurationMs
        ) {
            return;
        }

        this.resetToReady(
            pointDefense,
        );
    }

    private findTargetProjectile(
        actor: ShipEncounterActorState,
        pointDefense: ShipPointDefenseState,
    ): MissileCombatProjectileState | undefined {
        const projectileId =
            pointDefense.targetProjectileId;

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
        pointDefense: ShipPointDefenseState,
    ): void {
        pointDefense.phase =
            POINT_DEFENSE_PHASE.READY;
        pointDefense.phaseElapsedMs = 0;
        pointDefense.loadedBand = null;
        pointDefense.targetProjectileId = null;
    }
}
