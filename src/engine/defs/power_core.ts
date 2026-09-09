// src/engine/defs/power_core.ts

import { SHIP_SLOT_KIND } from "./ship_slot";

// Удобный стабильный id встроенного Power Core.
// Каталог открыт для новых module ids из content editor.
export const POWER_CORE_ID = {
    BASIC_00: "power_core_basic_00",
} as const;

export type PowerCoreDefinition = {
    id: string;

    name: string;
    shortName: string;
    iconId: string;

    slotKind: typeof SHIP_SLOT_KIND.POWER_CORE;

    maxIntegrity: number;

    // Сколько power charges
    // установка может хранить одновременно.
    capacity: number;

    // Время последовательного восстановления
    // одного power charge.
    rechargeDurationMs: number;
};

// Persistent/runtime charge state одного установленного Power Core.
//
// Encounter integrity живёт отдельно в EncounterPowerCoreState,
// как и integrity остальных installed equipment.
export type PowerCoreState = {
    // Runtime id конкретной установки.
    id: string;

    // Immutable content definition.
    powerCoreId: string;

    charges: number;

    // Progress восстановления следующего charge.
    // При полном Power Core всегда 0.
    rechargeElapsedMs: number;
};
