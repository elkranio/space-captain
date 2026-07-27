// src/engine/defs/missile.ts

export const MISSILE_GUIDANCE_KIND = {
    HEAT: 'heat',
} as const;

export type MissileGuidanceKind = (typeof MISSILE_GUIDANCE_KIND)[keyof typeof MISSILE_GUIDANCE_KIND];

export const MISSILE_ID = {
    HEAT_00: 'heat_00',
} as const;

export type MissileId = (typeof MISSILE_ID)[keyof typeof MISSILE_ID];

export type MissileDefinition = {
    id: MissileId;
    name: string;

    guidanceKind: MissileGuidanceKind;

    damage: number;
    flightDurationMs: number;
};
