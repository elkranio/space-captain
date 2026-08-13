// src/engine/defs/missile.ts

// Hidden runtime property of one concrete missile projectile.
// It is intentionally not part of MissileDefinition.
export const MISSILE_SIGNATURE = {
    A: 'signature_a',
    B: 'signature_b',
} as const;

export type MissileSignature =
    (typeof MISSILE_SIGNATURE)[keyof typeof MISSILE_SIGNATURE];

export const MISSILE_ID = {
    BASIC_00: 'basic_00',
    BASIC_01: 'basic_01',
} as const;

export type MissileId =
    (typeof MISSILE_ID)[keyof typeof MISSILE_ID];

export type MissileDefinition = {
    id: MissileId;
    name: string;

    damage: number;
    flightDurationMs: number;
};
