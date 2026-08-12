// src/engine/encounter/combat/defense/EnemyShieldRunner.ts

import {
    SHIELD_EMITTERS,
} from '../../../content/catalogs/shield_emitters';
import {
    ENCOUNTER_TEAM,
} from '../../../defs/encounter_team';
import {
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
} from '../../../defs/shield_emitter';
import type {
    ShipEncounterActorState,
} from '../../actors/ship/ship_encounter_actor';
import type {
    EncounterState,
} from '../../model/state';
import {
    advanceShieldEmitter,
} from './ShieldEmitterRunner';

// Whole-ship enemy shield lifecycle.
//
// No sectors or hit nodes yet: one active field protects the actor
// from one player laser and otherwise expires by duration.
export default class EnemyShieldRunner {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public step(
        deltaMs: number,
    ): void {
        if (
            !Number.isFinite(deltaMs) ||
            deltaMs < 0
        ) {
            throw new Error(
                'Enemy shield deltaMs must be non-negative: ' +
                    String(deltaMs),
            );
        }

        for (const actor of this.state.actors) {
            if (
                actor.team !==
                    ENCOUNTER_TEAM.ENEMY ||
                actor.hull <= 0
            ) {
                continue;
            }

            if (actor.shieldEmitter) {
                advanceShieldEmitter(
                    actor.shieldEmitter,
                    deltaMs,
                );
            }

            const shield =
                actor.activeShield;

            if (!shield) {
                continue;
            }

            shield.remainingDurationMs =
                Math.max(
                    0,
                    shield.remainingDurationMs -
                        deltaMs,
                );

            if (
                shield.remainingDurationMs >
                0
            ) {
                continue;
            }

            delete actor.activeShield;
        }
    }

    public deploy(
        actor: ShipEncounterActorState,
    ): void {
        const emitter =
            actor.shieldEmitter;

        if (
            actor.team !==
                ENCOUNTER_TEAM.ENEMY ||
            !emitter ||
            emitter.status !==
                SHIELD_EMITTER_STATUS.ONLINE ||
            emitter.phase !==
                SHIELD_EMITTER_PHASE.READY ||
            actor.activeShield
        ) {
            throw new Error(
                'Cannot deploy enemy shield: ' +
                    actor.id,
            );
        }

        const definition =
            SHIELD_EMITTERS[
                emitter.shieldEmitterId
            ];

        actor.activeShield = {
            sourceEmitterId:
                emitter.id,

            remainingDurationMs:
                definition
                    .shieldDurationMs,

            initialDurationMs:
                definition
                    .shieldDurationMs,
        };

        emitter.phase =
            SHIELD_EMITTER_PHASE.COOLDOWN;
        emitter.phaseElapsedMs = 0;
    }
}
