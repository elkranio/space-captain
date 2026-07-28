// src/engine/defs/point_defense.ts

export const POINT_DEFENSE_BEAM_BAND = {
    RED: 'red',
    BLUE: 'blue',
} as const;

export type PointDefenseBeamBand = (typeof POINT_DEFENSE_BEAM_BAND)[keyof typeof POINT_DEFENSE_BEAM_BAND];
