// src/engine/encounter/combat/ShieldGeneratorRunner.ts

import type { ShieldGeneratorState } from '../../defs/shield_generator';
import { ENCOUNTER_EVENT, type EncounterEvent } from '../model/event';
import type { EncounterState } from '../model/state';

type ShieldGeneratorRunnerOptions = {
    state: EncounterState;
    emit: (event: EncounterEvent) => void;
};

// Управляет непрерывным восстановлением charges
// player shield generator.
//
// Каждый charge восстанавливается последовательно:
// один общий progress timer, без параллельной регенерации.
export default class ShieldGeneratorRunner {
    private readonly state: EncounterState;

    private readonly emit: (event: EncounterEvent) => void;

    constructor({ state, emit }: ShieldGeneratorRunnerOptions) {
        this.state = state;
        this.emit = emit;
    }

    public step(deltaMs: number): void {
        if (deltaMs <= 0) {
            return;
        }

        const shieldGenerator = this.state.combat.shieldGenerator;

        if (!shieldGenerator) {
            return;
        }

        if (shieldGenerator.charges >= shieldGenerator.maxCharges) {
            return;
        }

        shieldGenerator.chargeRegenerationElapsedMs += deltaMs;

        this.regenerateCompletedCharges(shieldGenerator);

        this.emitStateChanged(shieldGenerator);
    }

    private regenerateCompletedCharges(shieldGenerator: ShieldGeneratorState): void {
        const completedCharges = Math.floor(
            shieldGenerator.chargeRegenerationElapsedMs /
                shieldGenerator.chargeRegenerationDurationMs,
        );

        if (completedCharges <= 0) {
            return;
        }

        const missingCharges = shieldGenerator.maxCharges - shieldGenerator.charges;
        const regeneratedCharges = Math.min(completedCharges, missingCharges);

        shieldGenerator.charges += regeneratedCharges;
        shieldGenerator.chargeRegenerationElapsedMs -=
            regeneratedCharges * shieldGenerator.chargeRegenerationDurationMs;

        // Нельзя заранее накопить progress следующего charge,
        // пока generator полностью заряжен.
        if (shieldGenerator.charges === shieldGenerator.maxCharges) {
            shieldGenerator.chargeRegenerationElapsedMs = 0;
        }
    }

    private emitStateChanged(shieldGenerator: ShieldGeneratorState): void {
        this.emit({
            type: ENCOUNTER_EVENT.PLAYER_SHIELD_GENERATOR_STATE_CHANGED,

            shieldGenerator: {
                ...shieldGenerator,
            },
        });
    }
}
