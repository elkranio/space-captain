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

// Physical cooldown rule одной установленной player shield-emitter системы.
//
// Active shield здесь намеренно ещё не существует.
// Этот runner отвечает только за installed-system cooldown lifecycle.
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

        if (!emitter) {
            return;
        }

        advanceShieldEmitter(
            emitter,
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
