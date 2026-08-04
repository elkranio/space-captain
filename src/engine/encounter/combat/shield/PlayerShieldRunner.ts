// src/engine/encounter/combat/PlayerShieldRunner.ts

import type { EncounterState } from '../../model/state';

type PlayerShieldRunnerOptions = {
    state: EncounterState;
};

// Управляет временем жизни encounter-only player shield field.
//
// Runner вызывается до OfficerTaskRunner:
// shield, созданный завершившейся в текущем step Engineer task,
// начинает терять lifetime только со следующего step.
export default class PlayerShieldRunner {
    private readonly state: EncounterState;

    constructor({ state }: PlayerShieldRunnerOptions) {
        this.state = state;
    }

    public step(deltaMs: number): void {
        if (deltaMs <= 0) {
            return;
        }

        const activeShield = this.state.combat.activeShield;

        if (!activeShield) {
            return;
        }

        activeShield.elapsedMs = Math.min(
            activeShield.elapsedMs + deltaMs,
            activeShield.durationMs,
        );

        if (activeShield.elapsedMs < activeShield.durationMs) {
            return;
        }

        delete this.state.combat.activeShield;
    }
}
