// src/engine/defs/point_defense.ts

export type PointDefenseState = {
    charges: number;
    maxCharges: number;
};

export const POINT_DEFENSE_BEAM_BAND = {
    RED: 'red',
    BLUE: 'blue',
} as const;

export type PointDefenseBeamBand = (typeof POINT_DEFENSE_BEAM_BAND)[keyof typeof POINT_DEFENSE_BEAM_BAND];

export const POINT_DEFENSE_SHOT_OUTCOME = {
    HIT: 'hit',
    MISS: 'miss',
} as const;

export type PointDefenseShotOutcome = (typeof POINT_DEFENSE_SHOT_OUTCOME)[keyof typeof POINT_DEFENSE_SHOT_OUTCOME];
