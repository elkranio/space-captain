// src/app/manifests/stations/station_sprite.ts

import { STATION_OBJECT_SPRITE_ID, type StationObjectSpriteId } from '../../../engine/defs/station';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const STATION_OBJECT_SPRITES = {
    [STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'stations/human_small_00',
    },

    [STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_01]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'stations/human_small_01',
    },

    [STATION_OBJECT_SPRITE_ID.ALIEN_SMALL_00]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'stations/alien_small_00',
    },

    [STATION_OBJECT_SPRITE_ID.ALIEN_SMALL_01]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'stations/alien_small_01',
    },
} satisfies Record<StationObjectSpriteId, SpriteEntry>;
