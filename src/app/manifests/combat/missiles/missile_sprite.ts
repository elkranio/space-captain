// src/app/manifests/combat/missiles/missile_sprite.ts

import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../../types';

export const MISSILE_SPRITE_ID = {
    GENERIC_00: 'generic_00',
} as const;

export type MissileSpriteId = (typeof MISSILE_SPRITE_ID)[keyof typeof MISSILE_SPRITE_ID];

export const MISSILE_SPRITES = {
    [MISSILE_SPRITE_ID.GENERIC_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'combat/missiles/generic_00',
    },
} satisfies Record<MissileSpriteId, SpriteEntry>;
