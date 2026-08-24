// src/engine/encounter/combat/power_core/PowerCoreRunner.ts

import { POWER_CORES } from "../../../content/catalogs/power_cores";
import type { PowerCoreState } from "../../../defs/power_core";
import { ENCOUNTER_ACTOR_KIND } from "../../actors/encounter_actor";
import type { EncounterState } from "../../model/state";

// Один physical recharge rule для player/enemy installations.
//
// Charges восстанавливаются последовательно:
// 2/4 -> 3/4 -> 4/4.
// При полном powerCore progress всегда сбрасывается в 0.
export default class PowerCoreRunner {
    constructor(private readonly state: EncounterState) {}

    public step(deltaMs: number): void {
        if (!Number.isFinite(deltaMs) || deltaMs < 0) {
            throw new Error("Defense powerCore deltaMs must be non-negative: " + String(deltaMs));
        }

        const playerPowerCore = this.state.combat.powerCore;

        if (playerPowerCore) {
            advancePowerCore(playerPowerCore, deltaMs);
        }

        for (const actor of this.state.actors) {
            if (actor.kind !== ENCOUNTER_ACTOR_KIND.SHIP) {
                continue;
            }

            if (!actor.powerCore) {
                continue;
            }

            advancePowerCore(actor.powerCore, deltaMs);
        }
    }
}

export function advancePowerCore(powerCore: PowerCoreState, deltaMs: number): void {
    const definition = POWER_CORES[powerCore.powerCoreId];

    if (powerCore.charges >= definition.capacity) {
        powerCore.charges = definition.capacity;

        powerCore.rechargeElapsedMs = 0;

        return;
    }

    let elapsedMs = powerCore.rechargeElapsedMs + deltaMs;

    while (powerCore.charges < definition.capacity && elapsedMs >= definition.rechargeDurationMs) {
        powerCore.charges += 1;

        elapsedMs -= definition.rechargeDurationMs;
    }

    powerCore.rechargeElapsedMs = powerCore.charges >= definition.capacity ? 0 : elapsedMs;
}
