// src/engine/encounter/combat/queries/get_next_clearable_sticky_mine.ts

import {
    OFFICER_TASK_KIND,
} from '../../model/officer_task';
import type {
    StickyMineState,
} from '../../model/combat';
import type {
    EncounterState,
} from '../../model/state';

// Выбирает ближайшую к детонации мину,
// которая ещё не зарезервирована active CLEAR MINE task.
//
// Active task — единственный источник reservation state.
// Отдельного reservedByOfficer у мины нет.
export function getNextClearableStickyMine(
    state: EncounterState,
): StickyMineState | undefined {
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

    let nextMine: StickyMineState | undefined;

    for (const mine of state.combat.stickyMines) {
        if (reservedMineIds.has(mine.id)) {
            continue;
        }

        if (
            !nextMine ||
            mine.timeToDetonationMs <
                nextMine.timeToDetonationMs
        ) {
            nextMine = mine;
        }
    }

    return nextMine;
}
