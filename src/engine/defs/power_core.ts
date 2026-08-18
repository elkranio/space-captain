// src/engine/defs/power_core.ts

// Удобный стабильный id встроенного Power Core.
// Каталог открыт для новых module ids из content editor.
export const POWER_CORE_ID = {
    BASIC_00: "power_core_basic_00",
} as const;

export type PowerCoreId = string;

export type PowerCoreDefinition = {
    id: PowerCoreId;

    name: string;

    // Сколько power charges
    // установка может хранить одновременно.
    capacity: number;

    // Время последовательного восстановления
    // одного power charge.
    rechargeDurationMs: number;
};

// Mutable runtime state одного установленного Power Core.
//
// Shared combat power resource.
// Все consumers тратят charges из одного pool.
//
// Пока operational/broken status намеренно
// не добавляем: общий контракт поломок
// проверим отдельным infrastructure audit.
export type PowerCoreState = {
    // Runtime id конкретной установки.
    id: string;

    // Immutable content definition.
    powerCoreId: PowerCoreId;

    charges: number;

    // Progress восстановления следующего charge.
    // При полном Power Core всегда 0.
    rechargeElapsedMs: number;
};
