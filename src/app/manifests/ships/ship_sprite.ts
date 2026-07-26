// src/app/manifests/ships/ship_sprite.ts

import { SHIP_SPRITE_ID, type ShipSpriteId } from '../../../engine/defs/ship';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const SHIP_SPRITES = {
    [SHIP_SPRITE_ID.UNKNOWN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ships/unknown_00',
    },

    [SHIP_SPRITE_ID.GENERIC_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ships/generic_ship_00',
    },
} satisfies Record<ShipSpriteId, SpriteEntry>;
