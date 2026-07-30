// src/engine/defs/shield_generator.ts

export type ShieldGeneratorState = {
    charges: number;
    maxCharges: number;

    chargeRegenerationDurationMs: number;
    chargeRegenerationElapsedMs: number;
};
