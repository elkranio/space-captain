// src/engine/encounter/combat/queries/get_sticky_mine_snapshots.ts

import {
    getNextClearableStickyMine,
} from './get_next_clearable_sticky_mine';
import type {
    StickyMineState,
} from '../../model/combat';
import {
    OFFICER_TASK_KIND,
} from '../../model/officer_task';
import type {
    EncounterState,
} from '../../model/state';

export type StickyMineSnapshot = {
    mine: StickyMineState;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;
};

export function getStickyMineSnapshots(
    state: EncounterState,
): StickyMineSnapshot[] {
    const reservedMineIds = new Set<string>();

    for (
        const task of Object.values(
            state.officerTasks,
        )
    ) {
        if (
            task?.kind !==
            OFFICER_TASK_KIND.CLEAR_STICKY_MINE
        ) {
            continue;
        }

        reservedMineIds.add(task.mineId);
    }

    const nextMine =
        getNextClearableStickyMine(state);

    return state.combat.stickyMines.map(
        (mine) => {
            return {
                mine: {
                    ...mine,
                },

                isBeingCleared:
                    reservedMineIds.has(mine.id),

                isNextClearTarget:
                    mine.id === nextMine?.id,
            };
        },
    );
}
