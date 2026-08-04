// src/engine/encounter/combat/EnemyShieldRunner.ts

import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import type {
    EncounterState,
} from '../../model/state';

// Owns enemy shield lifetime and generator regeneration.
//
// EncounterEngine advances this runner before PlayerWeaponRunner:
// - an expiring shield cannot block a laser on the same timing boundary;
// - a shield deployed later in the current combat step starts aging only
//   on the next encounter step.
export default class EnemyShieldRunner {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public step(
        deltaMs: number,
    ): void {
        if (deltaMs <= 0) {
            return;
        }

        for (const actor of this.state.actors) {
            if (
                actor.team !==
                    ENCOUNTER_TEAM.ENEMY ||
                actor.hull <= 0
            ) {
                continue;
            }

            this.advanceActiveShield(
                actor,
                deltaMs,
            );

            this.regenerateGenerator(
                actor,
                deltaMs,
            );
        }
    }

    private advanceActiveShield(
        actor:
            ShipEncounterActorState,
        deltaMs: number,
    ): void {
        const activeShield =
            actor.activeShield;

        if (!activeShield) {
            return;
        }

        activeShield.elapsedMs =
            Math.min(
                activeShield.durationMs,
                activeShield.elapsedMs +
                    deltaMs,
            );

        if (
            activeShield.elapsedMs <
            activeShield.durationMs
        ) {
            return;
        }

        delete actor.activeShield;
    }

    private regenerateGenerator(
        actor:
            ShipEncounterActorState,
        deltaMs: number,
    ): void {
        const generator =
            actor.shieldGenerator;

        if (
            generator.charges >=
            generator.maxCharges
        ) {
            return;
        }

        generator
            .chargeRegenerationElapsedMs +=
            deltaMs;

        const completedCharges =
            Math.floor(
                generator
                    .chargeRegenerationElapsedMs /
                    generator
                        .chargeRegenerationDurationMs,
            );

        if (completedCharges <= 0) {
            return;
        }

        const regeneratedCharges =
            Math.min(
                completedCharges,

                generator.maxCharges -
                    generator.charges,
            );

        generator.charges +=
            regeneratedCharges;

        generator
            .chargeRegenerationElapsedMs -=
            regeneratedCharges *
            generator
                .chargeRegenerationDurationMs;

        if (
            generator.charges ===
            generator.maxCharges
        ) {
            generator
                .chargeRegenerationElapsedMs =
                0;
        }
    }
}
