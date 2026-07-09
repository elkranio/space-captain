// src\app\manifests\ships\ship_sprite.ts
import { SHIP_SPRITE, type ShipSprite } from '../../../engine/defs/ship';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const SHIP_SPRITE_MANIFEST = {
    [SHIP_SPRITE.UNKNOWN_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ships/unknown_00',
    },

    [SHIP_SPRITE.KRELBOID_PIRATE_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'ships/krelboid_pirate_00',
    },
} satisfies Record<ShipSprite, SpriteEntry>;
