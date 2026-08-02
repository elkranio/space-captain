// src/engine/content/catalogs/sticky_mines.ts

import {
    STICKY_MINE_ID,
    type StickyMineDefinition,
    type StickyMineId,
} from '../../defs/sticky_mine';

export const STICKY_MINES = {
    [STICKY_MINE_ID.BASIC_00]: {
        id: STICKY_MINE_ID.BASIC_00,

        name: 'STICKY MINE',

        fuseDurationMs: 7500,
        damage: 1,
    },
} satisfies Record<
    StickyMineId,
    StickyMineDefinition
>;
