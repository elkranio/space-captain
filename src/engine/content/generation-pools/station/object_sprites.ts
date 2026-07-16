// src/engine/content/generation-pools/station/object_sprites.ts

import { SPECIES_ID, type SpeciesId } from '../../../defs/species';
import { STATION_OBJECT_SPRITE_ID, type StationObjectSpriteId } from '../../../defs/station';

// Пулы внешних спрайтов станций для encounter object.
// Вид станции выбирает набор спрайтов, конкретный вариант выбирается генератором.
export const STATION_OBJECT_SPRITE_POOLS_BY_SPECIES = {
    [SPECIES_ID.HUMAN]: [STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_00, STATION_OBJECT_SPRITE_ID.HUMAN_SMALL_01],

    [SPECIES_ID.ALIEN]: [STATION_OBJECT_SPRITE_ID.ALIEN_SMALL_00, STATION_OBJECT_SPRITE_ID.ALIEN_SMALL_01],
} satisfies Record<SpeciesId, readonly StationObjectSpriteId[]>;
