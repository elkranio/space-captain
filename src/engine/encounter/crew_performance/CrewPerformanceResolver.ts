// src/engine/encounter/crew_performance/CrewPerformanceResolver.ts

import { COMBAT_TARGET_KIND } from "../model/combat";
import type { EncounterState } from "../model/state";
import { getActiveCrewProgressEffects } from "./get_active_crew_progress_effects";

// Single source of truth for current crew/officer progress speed.
//
// The resolver does not own mutable state, advance clocks or emit events.
// Identical effects do not multiply: the strongest active slowdown wins.
export default class CrewPerformanceResolver {
    constructor(private readonly state: EncounterState) {}

    public getPlayerProgressMultiplier(): number {
        let multiplier = 1;

        for (const effect of getActiveCrewProgressEffects(this.state)) {
            if (effect.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
                continue;
            }

            const value = effect.progressMultiplier;

            if (!Number.isFinite(value) || value < 0) {
                throw new Error("Invalid crew progress multiplier: player/" + effect.id + "/" + value);
            }

            multiplier = Math.min(multiplier, value);
        }

        return multiplier;
    }

    public getActorProgressMultiplier(actorId: string): number {
        let multiplier = 1;

        for (const effect of getActiveCrewProgressEffects(this.state)) {
            if (effect.target.kind !== COMBAT_TARGET_KIND.ACTOR || effect.target.actorId !== actorId) {
                continue;
            }

            const value = effect.progressMultiplier;

            if (!Number.isFinite(value) || value < 0) {
                throw new Error("Invalid crew progress multiplier: actor:" + actorId + "/" + effect.id + "/" + value);
            }

            multiplier = Math.min(multiplier, value);
        }

        return multiplier;
    }
}
