// src/engine/encounter/combat/defense/ShieldEmitterRunner.ts

import {
    SHIELD_EMITTERS,
} from '../../../content/catalogs/shield_emitters';
import {
    SHIELD_EMITTER_PHASE,
    SHIELD_EMITTER_STATUS,
    type ShieldEmitterState,
} from '../../../defs/shield_emitter';
import type {
    EncounterState,
} from '../../model/state';

// Runtime lifecycle player shield system:
// - installed emitter cooldown;
// - temporary active-shield lifetime.
export default class ShieldEmitterRunner {
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
                'Shield emitter deltaMs must be non-negative: ' +
                    String(deltaMs),
            );
        }

        const emitter =
            this.state.combat
                .shieldEmitter;

        if (emitter) {
            advanceShieldEmitter(
                emitter,
                deltaMs,
            );
        }

        advanceActiveShield(
            this.state,
            deltaMs,
        );
    }
}

export function advanceShieldEmitter(
    emitter:
        ShieldEmitterState,
    deltaMs: number,
): void {
    if (
        emitter.status ===
        SHIELD_EMITTER_STATUS.BROKEN
    ) {
        return;
    }

    switch (emitter.phase) {
        case SHIELD_EMITTER_PHASE.READY:
            emitter.phaseElapsedMs = 0;
            return;

        case SHIELD_EMITTER_PHASE.COOLDOWN: {
            const definition =
                SHIELD_EMITTERS[
                    emitter
                        .shieldEmitterId
                ];

            const elapsedMs =
                emitter.phaseElapsedMs +
                deltaMs;

            if (
                elapsedMs >=
                definition
                    .cooldownDurationMs
            ) {
                emitter.phase =
                    SHIELD_EMITTER_PHASE.READY;

                emitter.phaseElapsedMs = 0;

                return;
            }

            emitter.phaseElapsedMs =
                elapsedMs;

            return;
        }

        default: {
            const exhaustivePhase:
                never =
                    emitter.phase;

            return exhaustivePhase;
        }
    }
}

export function advanceActiveShield(
    state:
        EncounterState,
    deltaMs: number,
): void {
    const shield =
        state.combat
            .activeShield;

    if (!shield) {
        return;
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
        return;
    }

    state.combat
        .activeShield =
            null;
}
