// src/engine/encounter/combat/defense/ShieldGeneratorRunner.ts

import {
    SHIELD_GENERATORS,
} from '../../../content/catalogs/shield_generators';
import {
    SHIELD_GENERATOR_PHASE,
    SHIELD_GENERATOR_STATUS,
    type ShieldGeneratorState,
} from '../../../defs/shield_generator';
import type {
    ActiveShieldState,
} from '../../model/combat';
import {
    ENCOUNTER_EVENT,
    PLAYER_SHIELD_END_OUTCOME,
    type EncounterEvent,
} from '../../model/event';
import type {
    EncounterState,
} from '../../model/state';

// Runtime lifecycle player shield system:
// - installed emitter cooldown;
// - temporary active-shield lifetime;
// - natural shield-expiry outbox event.
export default class ShieldGeneratorRunner {
    constructor(
        private readonly state:
            EncounterState,

        private readonly emit:
            (event: EncounterEvent) => void,
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
                .shieldGenerator;

        if (emitter) {
            advanceShieldGenerator(
                emitter,
                deltaMs,
            );
        }

        const expiredShield =
            advanceActiveShield(
                this.state,
                deltaMs,
            );

        if (!expiredShield) {
            return;
        }

        this.emit({
            type:
                ENCOUNTER_EVENT
                    .PLAYER_SHIELD_ENDED,

            shield:
                expiredShield,

            outcome:
                PLAYER_SHIELD_END_OUTCOME
                    .EXPIRED,
        });
    }
}

export function advanceShieldGenerator(
    emitter:
        ShieldGeneratorState,
    deltaMs: number,
): void {
    if (
        emitter.status ===
        SHIELD_GENERATOR_STATUS.BROKEN
    ) {
        return;
    }

    switch (emitter.phase) {
        case SHIELD_GENERATOR_PHASE.READY:
            emitter.phaseElapsedMs = 0;
            return;

        case SHIELD_GENERATOR_PHASE.COOLDOWN: {
            const definition =
                SHIELD_GENERATORS[
                    emitter
                        .shieldGeneratorId
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
                    SHIELD_GENERATOR_PHASE.READY;

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
): ActiveShieldState | undefined {
    const shield =
        state.combat
            .activeShield;

    if (!shield) {
        return undefined;
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
        return undefined;
    }

    const endedShield = {
        ...shield,
    };

    state.combat
        .activeShield =
            null;

    return endedShield;
}
