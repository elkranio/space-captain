// src/engine/defs/missile.ts

export const MISSILE_SPECTRAL_BAND = {
    RED: 'red',
    BLUE: 'blue',
} as const;

export type MissileSpectralBand = (typeof MISSILE_SPECTRAL_BAND)[keyof typeof MISSILE_SPECTRAL_BAND];

export const MISSILE_ID = {
    RED_00: 'red_00',
} as const;

export type MissileId = (typeof MISSILE_ID)[keyof typeof MISSILE_ID];

export type MissileDefinition = {
    id: MissileId;
    name: string;

    spectralBand: MissileSpectralBand;

    damage: number;
    flightDurationMs: number;
};
