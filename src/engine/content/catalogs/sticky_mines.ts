// src/engine/content/catalogs/sticky_mines.ts

import stickyMineTuningData from '../data/sticky_mines.json';
import {
    STICKY_MINE_TUNING_SCHEMA,
} from '../schemas/sticky_mines';
import {
    STICKY_MINE_ID,
    type StickyMineDefinition,
    type StickyMineId,
} from '../../defs/sticky_mine';

const STICKY_MINE_TUNING =
    STICKY_MINE_TUNING_SCHEMA.parse(
        stickyMineTuningData,
    );

export const STICKY_MINES = {
    [STICKY_MINE_ID.BASIC_00]: {
        id:
            STICKY_MINE_ID.BASIC_00,

        ...STICKY_MINE_TUNING[
            STICKY_MINE_ID.BASIC_00
        ],
    },
} satisfies Record<
    StickyMineId,
    StickyMineDefinition
>;
