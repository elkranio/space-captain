// src/engine/encounter/officer_performance/OfficerPerformanceResolver.ts

import { getActiveEnemySpamChannels } from '../combat/queries/get_active_enemy_spam_channels';
import type { OfficerTaskState } from '../model/officer_task';
import type EncounterStateStore from '../state/EncounterStateStore';

// Единая точка вычисления текущей производительности officer task.
// Не хранит state, не двигает progress и не эмитит events.
export default class OfficerPerformanceResolver {
    constructor(
        private readonly stateStore: EncounterStateStore,
    ) {}

    public getTaskProgressMultiplier(
        task: OfficerTaskState,
    ): number {
        let multiplier = 1;

        for (const channel of getActiveEnemySpamChannels(
            this.stateStore.getState(),
        )) {
            const value = channel.officerTaskProgressMultiplier;

            if (!Number.isFinite(value) || value < 0) {
                throw new Error(
                    'Invalid officer task progress multiplier: ' +
                        task.id +
                        '/' +
                        channel.id +
                        '/' +
                        value,
                );
            }

            // Одинаковые spam effects не перемножаются.
            multiplier = Math.min(multiplier, value);
        }

        return multiplier;
    }
}
