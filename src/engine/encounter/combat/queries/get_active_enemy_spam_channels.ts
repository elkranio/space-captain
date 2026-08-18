// src/engine/encounter/combat/queries/get_active_enemy_spam_channels.ts

import { getActiveCrewProgressEffects } from "../../crew_performance/get_active_crew_progress_effects";
import { COMBAT_TARGET_KIND } from "../../model/combat";
import type { EncounterState } from "../../model/state";

export type ActiveEnemySpamChannel = {
    id: string;

    officerTaskProgressMultiplier: number;
};

// Transitional compatibility query.
//
// Active channel discovery now lives in getActiveCrewProgressEffects.
// This shape remains temporarily for purge-task target validation.
export function getActiveEnemySpamChannels(state: EncounterState): ActiveEnemySpamChannel[] {
    const channels: ActiveEnemySpamChannel[] = [];

    for (const effect of getActiveCrewProgressEffects(state)) {
        if (effect.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            continue;
        }

        channels.push({
            id: effect.id,

            officerTaskProgressMultiplier: effect.progressMultiplier,
        });
    }

    return channels;
}
