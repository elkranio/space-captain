// src\engine\content\generation-pools\station\sprites.ts

import { SPECIES_ID, type SpeciesId } from '../../../defs/species';
import { STATION_SPRITE_ID, type StationSpriteId } from '../../../defs/station';

export const STATION_SPRITE_POOLS_BY_SPECIES = {
    [SPECIES_ID.HUMAN]: [STATION_SPRITE_ID.HUMAN_SMALL_00, STATION_SPRITE_ID.HUMAN_SMALL_01],

    [SPECIES_ID.ALIEN]: [STATION_SPRITE_ID.ALIEN_SMALL_00, STATION_SPRITE_ID.ALIEN_SMALL_01],
} satisfies Record<SpeciesId, readonly StationSpriteId[]>;
