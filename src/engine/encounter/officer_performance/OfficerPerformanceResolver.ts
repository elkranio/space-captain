// src/engine/encounter/officer_performance/OfficerPerformanceResolver.ts

import CrewPerformanceResolver from '../crew_performance/CrewPerformanceResolver';
import type {
    OfficerTaskState,
} from '../model/officer_task';
import type EncounterStateStore from '../state/EncounterStateStore';

// Transitional adapter for existing player task/weapon runner contracts.
//
// CrewPerformanceResolver owns all effect discovery, validation and stacking.
// Atom 14 can remove this adapter when concrete runners receive already-scaled
// crew delta instead of resolving performance themselves.
export default class OfficerPerformanceResolver {
    private readonly resolver:
        CrewPerformanceResolver;

    constructor(
        stateStore: EncounterStateStore,
    ) {
        this.resolver =
            new CrewPerformanceResolver(
                stateStore.getState(),
            );
    }

    public getTaskProgressMultiplier(
        task: OfficerTaskState,
    ): number {
        // Kept only for the existing API shape.
        // Performance no longer depends on task identity.
        void task;

        return this.resolver
            .getPlayerProgressMultiplier();
    }
}
