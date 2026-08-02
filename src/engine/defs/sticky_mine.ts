// src/engine/defs/sticky_mine.ts

export const STICKY_MINE_ID = {
    BASIC_00: 'basic_00',
} as const;

export type StickyMineId =
    (typeof STICKY_MINE_ID)[keyof typeof STICKY_MINE_ID];

// Неизменяемый payload одной sticky mine.
//
// Dispenser отвечает только за хранение
// и последовательный запуск боеприпасов.
export type StickyMineDefinition = {
    id: StickyMineId;
    name: string;

    fuseDurationMs: number;
    damage: number;
};
