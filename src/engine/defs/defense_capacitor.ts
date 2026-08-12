// src/engine/defs/defense_capacitor.ts

export const DEFENSE_CAPACITOR_ID = {
    BASIC_00:
        'defense_capacitor_basic_00',
} as const;

export type DefenseCapacitorId =
    (typeof DEFENSE_CAPACITOR_ID)[keyof typeof DEFENSE_CAPACITOR_ID];

export type DefenseCapacitorDefinition = {
    id: DefenseCapacitorId;

    name: string;

    // Сколько defensive charges
    // установка может хранить одновременно.
    capacity: number;

    // Время последовательного восстановления
    // одного defensive charge.
    rechargeDurationMs: number;
};

// Mutable runtime state одной установленной
// DEFENSE CAPACITOR.
//
// Shared defensive resource.
// Все defensive consumers тратят charges из одного pool.
//
// Пока operational/broken status намеренно
// не добавляем: общий контракт поломок
// проверим отдельным infrastructure audit.
export type DefenseCapacitorState = {
    // Runtime id конкретной установки.
    id: string;

    // Immutable content definition.
    defenseCapacitorId:
        DefenseCapacitorId;

    charges: number;

    // Progress восстановления следующего charge.
    // При полном capacitor всегда 0.
    rechargeElapsedMs: number;
};
