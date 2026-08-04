// src/engine/encounter/combat/EnemyCrewPerformanceResolver.ts

import type {
    ShipEncounterActorState,
} from '../actors/ship/ship_encounter_actor';
import CrewPerformanceResolver from '../crew_performance/CrewPerformanceResolver';
import type {
    EncounterState,
} from '../model/state';

// Transitional adapter for existing enemy runner contracts.
//
// CrewPerformanceResolver owns all effect discovery, validation and stacking.
// Atom 14 can remove this adapter together with multiplier plumbing through
// concrete combat runners.
export default class EnemyCrewPerformanceResolver {
    private readonly resolver:
        CrewPerformanceResolver;

    constructor(
        state: EncounterState,
    ) {
        this.resolver =
            new CrewPerformanceResolver(
                state,
            );
    }

    public getTaskProgressMultiplier(
        actor:
            ShipEncounterActorState,
    ): number {
        return this.resolver
            .getActorProgressMultiplier(
                actor.id,
            );
    }
}
