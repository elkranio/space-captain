// src/engine/encounter/combat/queries/get_next_clearable_sticky_mine.ts

import { COMBAT_TARGET_KIND, type StickyMineState } from "../../model/combat";
import { OFFICER_TASK_KIND } from "../../model/officer_task";
import type { EncounterState } from "../../model/state";

// Выбирает ближайшую к детонации мину
// на корпусе player ship,
// которая ещё не зарезервирована active CLEAR MINE task.
//
// Active task — единственный источник reservation state.
// Отдельного reservedByOfficer у мины нет.
export function getNextClearableStickyMine(state: EncounterState): StickyMineState | undefined {
    const reservedMineIds = new Set<string>();

    for (const task of Object.values(state.officerTasks)) {
        if (task?.kind !== OFFICER_TASK_KIND.CLEAR_STICKY_MINE) {
            continue;
        }

        reservedMineIds.add(task.mineId);
    }

    let nextMine: StickyMineState | undefined;

    for (const mine of state.combat.stickyMines) {
        if (mine.target.kind !== COMBAT_TARGET_KIND.PLAYER_SHIP) {
            continue;
        }

        if (reservedMineIds.has(mine.id)) {
            continue;
        }

        if (!nextMine || mine.timeToDetonationMs < nextMine.timeToDetonationMs) {
            nextMine = mine;
        }
    }

    return nextMine;
}
