// src/engine/defs/shield_generator.ts

// Удобный стабильный id встроенного Shield Generator.
// Каталог открыт для новых module ids из content editor.
export const SHIELD_GENERATOR_ID = {
    BASIC_00: "shield_generator_basic_00",
} as const;

export type ShieldGeneratorDefinition = {
    id: string;

    name: string;

    // Сколько живёт созданный генератором
    // active shield.
    shieldDurationMs: number;

    // Recovery starts when deployment work commits Power,
    // so it overlaps the Engineer deployment task.
    cooldownDurationMs: number;
};

export const SHIELD_GENERATOR_STATUS = {
    ONLINE: "online",
    BROKEN: "broken",
} as const;

export type ShieldGeneratorStatus = (typeof SHIELD_GENERATOR_STATUS)[keyof typeof SHIELD_GENERATOR_STATUS];

export const SHIELD_GENERATOR_PHASE = {
    READY: "ready",
    COOLDOWN: "cooldown",
} as const;

export type ShieldGeneratorPhase = (typeof SHIELD_GENERATOR_PHASE)[keyof typeof SHIELD_GENERATOR_PHASE];

// Mutable runtime state установленного shield generator.
//
// ВАЖНО:
// generator не хранит собственные charges.
// Установка active shield тратит общий Power Core.
export type ShieldGeneratorState = {
    // Runtime id конкретной установки.
    id: string;

    // Immutable content definition.
    shieldGeneratorId: string;

    status: ShieldGeneratorStatus;

    phase: ShieldGeneratorPhase;

    phaseElapsedMs: number;
};
