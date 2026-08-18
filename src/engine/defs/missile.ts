// src/engine/defs/missile.ts

// Hidden runtime property of one concrete missile projectile.
// Every launched projectile receives a fresh signature; launcher content never
// identifies future missiles.
export const MISSILE_SIGNATURE = {
    A: "signature_a",
    B: "signature_b",
} as const;

export type MissileSignature = (typeof MISSILE_SIGNATURE)[keyof typeof MISSILE_SIGNATURE];
