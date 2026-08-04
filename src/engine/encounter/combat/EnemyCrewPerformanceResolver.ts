// src/engine/encounter/combat/EnemyCrewPerformanceResolver.ts

import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import type {
    EncounterState,
} from '../model/state';
import {
    getActivePlayerSpamChannels,
} from './queries/get_active_player_spam_channels';

// Single source of truth for current NPC crew progress speed.
//
// Identical spam effects do not multiply. The strongest active slowdown wins,
// matching OfficerPerformanceResolver on the player side.
export default class EnemyCrewPerformanceResolver {
    constructor(
        private readonly state:
            EncounterState,
    ) {}

    public getTaskProgressMultiplier(
        actor:
            ShipEncounterActorState,
    ): number {
        let multiplier = 1;

        for (
            const channel of
            getActivePlayerSpamChannels(
                this.state,
            )
        ) {
            if (
                channel.targetActorId !==
                actor.id
            ) {
                continue;
            }

            const value =
                channel
                    .officerTaskProgressMultiplier;

            if (
                !Number.isFinite(
                    value,
                ) ||
                value < 0
            ) {
                throw new Error(
                    'Invalid enemy crew task ' +
                        'progress multiplier: ' +
                        actor.id +
                        '/' +
                        channel.id +
                        '/' +
                        value,
                );
            }

            multiplier =
                Math.min(
                    multiplier,
                    value,
                );
        }

        return multiplier;
    }
}
