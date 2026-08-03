// src/engine/encounter/combat/queries/get_sticky_mine_snapshots.ts

import {
    COMBAT_TARGET_KIND,
    type StickyMineState,
} from '../../model/combat';
import {
    OFFICER_TASK_KIND,
} from '../../model/officer_task';
import type {
    EncounterState,
} from '../../model/state';
import { createDetachedSnapshot } from '../../snapshots/create_detached_snapshot';
import {
    getNextClearableStickyMine,
} from './get_next_clearable_sticky_mine';

export type StickyMineSnapshot = {
    mine: StickyMineState;

    isBeingCleared: boolean;
    isNextClearTarget: boolean;
};

// Bridge sticky-mine view represents only mines
// physically attached to the player ship.
export function getStickyMineSnapshots(
    state: EncounterState,
): StickyMineSnapshot[] {
    const reservedMineIds =
        new Set<string>();

    for (
        const task of Object.values(
            state.officerTasks,
        )
    ) {
        if (
            task?.kind !==
            OFFICER_TASK_KIND
                .CLEAR_STICKY_MINE
        ) {
            continue;
        }

        reservedMineIds.add(
            task.mineId,
        );
    }

    const nextMine =
        getNextClearableStickyMine(
            state,
        );

    return createDetachedSnapshot(
        state.combat
            .stickyMines
            .filter((mine) => {
                return (
                    mine.target.kind ===
                    COMBAT_TARGET_KIND
                        .PLAYER_SHIP
                );
            })
            .map((mine) => {
                return {
                    mine,

                    isBeingCleared:
                        reservedMineIds.has(
                            mine.id,
                        ),

                    isNextClearTarget:
                        mine.id ===
                        nextMine?.id,
                };
            }),
    );
}
