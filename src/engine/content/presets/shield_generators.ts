// src/engine/content/presets/shield_generators.ts

export const SHIELD_GENERATOR_PRESET_ID = {
    BASIC_00: 'basic_00',
} as const;

export type ShieldGeneratorPresetId = (typeof SHIELD_GENERATOR_PRESET_ID)[keyof typeof SHIELD_GENERATOR_PRESET_ID];

export type ShieldGeneratorPreset = {
    id: ShieldGeneratorPresetId;

    maxCharges: number;
    chargeRegenerationDurationMs: number;
};

export const SHIELD_GENERATOR_PRESETS = {
    [SHIELD_GENERATOR_PRESET_ID.BASIC_00]: {
        id: SHIELD_GENERATOR_PRESET_ID.BASIC_00,

        maxCharges: 3,
        chargeRegenerationDurationMs: 20000,
    },
} satisfies Record<
    ShieldGeneratorPresetId,
    ShieldGeneratorPreset
>;
