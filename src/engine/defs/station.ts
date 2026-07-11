// src\engine\defs\station.ts

import type { SpeciesId } from './species';

export type StationId = string;

export const STATION_SPRITE_ID = {
    HUMAN_SMALL_00: 'human_small_00',
    HUMAN_SMALL_01: 'human_small_01',
} as const;

export type StationSpriteId = (typeof STATION_SPRITE_ID)[keyof typeof STATION_SPRITE_ID];

export type StationState = {
    id: StationId;
    name: string;
    originSpecies: SpeciesId;
    spriteId: StationSpriteId;
};
