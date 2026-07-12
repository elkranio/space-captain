// src\engine\defs\station.ts

import type { SpeciesId } from './species';

export const STATION_SPRITE_ID = {
    HUMAN_SMALL_00: 'human_small_00',
    HUMAN_SMALL_01: 'human_small_01',

    ALIEN_SMALL_00: 'alien_small_00',
    ALIEN_SMALL_01: 'alien_small_01',
} as const;

export type StationSpriteId = (typeof STATION_SPRITE_ID)[keyof typeof STATION_SPRITE_ID];

export type StationState = {
    id: string;
    name: string;
    originSpecies: SpeciesId;
    spriteId: StationSpriteId;
};
