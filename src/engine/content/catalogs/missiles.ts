// src/engine/content/catalogs/missiles.ts

import { MISSILE_ID, MISSILE_SPECTRAL_BAND, type MissileDefinition, type MissileId } from '../../defs/missile';

export const MISSILES = {
    [MISSILE_ID.RED_00]: {
        id: MISSILE_ID.RED_00,
        name: 'RED-BAND MISSILE',

        spectralBand: MISSILE_SPECTRAL_BAND.RED,

        damage: 1,
        flightDurationMs: 12000,
    },
} satisfies Record<MissileId, MissileDefinition>;
