// src/engine/encounter/combat/queries/get_active_player_spam_channels.ts

import {
    getActiveCrewProgressEffects,
} from '../../crew_performance/get_active_crew_progress_effects';
import {
    COMBAT_SOURCE_KIND,
    COMBAT_TARGET_KIND,
} from '../../model/combat';
import type {
    EncounterState,
} from '../../model/state';

export type ActivePlayerSpamChannel = {
    id: string;

    sourceWeaponId: string;
    targetActorId: string;

    officerTaskProgressMultiplier:
        number;
};

// Transitional compatibility query.
//
// Active channel discovery now lives in getActiveCrewProgressEffects.
// Atom 14 can move remaining callers to CrewPerformanceResolver/direct effects
// and delete this adapter.
export function getActivePlayerSpamChannels(
    state: EncounterState,
): ActivePlayerSpamChannel[] {
    const channels:
        ActivePlayerSpamChannel[] = [];

    for (
        const effect of
        getActiveCrewProgressEffects(
            state,
        )
    ) {
        if (
            effect.source.kind !==
                COMBAT_SOURCE_KIND
                    .PLAYER_SHIP ||
            effect.target.kind !==
                COMBAT_TARGET_KIND
                    .ACTOR
        ) {
            continue;
        }

        channels.push({
            id:
                effect.id,

            sourceWeaponId:
                effect.sourceWeaponId,

            targetActorId:
                effect.target.actorId,

            officerTaskProgressMultiplier:
                effect
                    .progressMultiplier,
        });
    }

    return channels;
}
