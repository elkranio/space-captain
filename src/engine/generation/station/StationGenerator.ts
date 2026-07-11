// src\engine\generation\station\StationGenerator.ts

import { STATION_NAME_POOLS_BY_SPECIES } from '../../content/generation-pools/station/names';
import { STATION_SPRITE_POOLS_BY_SPECIES } from '../../content/generation-pools/station/sprites';
import type { SpeciesId } from '../../defs/species';
import type { StationSpriteId, StationState } from '../../defs/station';
import { randomFrom } from '../utils/random_from';

export default class StationGenerator {
    public static generateStation(originSpecies: SpeciesId): StationState {
        return {
            id: this.generateStationId(),
            name: this.generateName(originSpecies),
            originSpecies,
            spriteId: this.generateSpriteId(originSpecies),
        };
    }

    private static generateStationId(): string {
        return `station_${Math.random().toString(36).slice(2, 10)}`;
    }

    private static generateName(originSpecies: SpeciesId): string {
        return randomFrom(STATION_NAME_POOLS_BY_SPECIES[originSpecies]);
    }

    private static generateSpriteId(originSpecies: SpeciesId): StationSpriteId {
        return randomFrom(STATION_SPRITE_POOLS_BY_SPECIES[originSpecies]);
    }
}
