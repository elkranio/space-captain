// src/engine/defs/shield_emitter.ts

export const SHIELD_EMITTER_ID = {
    BASIC_00:
        'shield_emitter_basic_00',
} as const;

export type ShieldEmitterId =
    (typeof SHIELD_EMITTER_ID)[keyof typeof SHIELD_EMITTER_ID];

export type ShieldEmitterDefinition = {
    id: ShieldEmitterId;

    name: string;

    // Сколько живёт созданный emitter-ом
    // active shield.
    shieldDurationMs: number;

    // После успешной установки shield
    // emitter нельзя использовать до окончания cooldown.
    cooldownDurationMs: number;
};

export const SHIELD_EMITTER_STATUS = {
    ONLINE: 'online',
    BROKEN: 'broken',
} as const;

export type ShieldEmitterStatus =
    (typeof SHIELD_EMITTER_STATUS)[keyof typeof SHIELD_EMITTER_STATUS];

export const SHIELD_EMITTER_PHASE = {
    READY: 'ready',
    COOLDOWN: 'cooldown',
} as const;

export type ShieldEmitterPhase =
    (typeof SHIELD_EMITTER_PHASE)[keyof typeof SHIELD_EMITTER_PHASE];

// Mutable runtime state установленного shield emitter.
//
// ВАЖНО:
// emitter не хранит собственные charges.
// Любая будущая установка active shield
// будет тратить общий Power Core.
export type ShieldEmitterState = {
    // Runtime id конкретной установки.
    id: string;

    // Immutable content definition.
    shieldEmitterId:
        ShieldEmitterId;

    status:
        ShieldEmitterStatus;

    phase:
        ShieldEmitterPhase;

    phaseElapsedMs: number;
};
