// src/engine/content/missiles.ts

import { MISSILE_GUIDANCE_KIND, MISSILE_ID, type MissileDefinition, type MissileId } from '../defs/missile';

export const MISSILES = {
    [MISSILE_ID.HEAT_00]: {
        id: MISSILE_ID.HEAT_00,
        name: 'HEAT SEEKER',

        guidanceKind: MISSILE_GUIDANCE_KIND.HEAT,
        damage: 1,
    },
} satisfies Record<MissileId, MissileDefinition>;
