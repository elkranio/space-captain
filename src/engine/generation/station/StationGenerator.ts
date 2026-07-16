// src/engine/generation/station/StationGenerator.ts

import { STATION_CONTACT_PORTRAIT_POOLS_BY_SPECIES } from '../../content/generation-pools/station/contact_portraits';
import { STATION_NAME_POOLS_BY_SPECIES } from '../../content/generation-pools/station/names';
import { STATION_OBJECT_SPRITE_POOLS_BY_SPECIES } from '../../content/generation-pools/station/object_sprites';
import type { CharacterPortraitId } from '../../defs/character';
import type { SpeciesId } from '../../defs/species';
import type { StationObjectSpriteId, StationState } from '../../defs/station';
import { randomFrom } from '../utils/random_from';

// Генерирует runtime-состояние станции из species-based content pools.
// Генератор выбирает имя, внешний спрайт и контактное лицо станции.
export default class StationGenerator {
    public static generateStation(originSpecies: SpeciesId): StationState {
        return {
            id: this.generateStationId(),
            name: this.generateName(originSpecies),
            originSpecies,
            objectSpriteId: this.generateObjectSpriteId(originSpecies),
            contact: {
                name: 'PORT CONTROL',
                portraitId: this.generateContactPortraitId(originSpecies),
            },
        };
    }

    private static generateStationId(): string {
        return `station_${Math.random().toString(36).slice(2, 10)}`;
    }

    private static generateName(originSpecies: SpeciesId): string {
        return randomFrom(STATION_NAME_POOLS_BY_SPECIES[originSpecies]);
    }

    private static generateObjectSpriteId(originSpecies: SpeciesId): StationObjectSpriteId {
        return randomFrom(STATION_OBJECT_SPRITE_POOLS_BY_SPECIES[originSpecies]);
    }

    private static generateContactPortraitId(originSpecies: SpeciesId): CharacterPortraitId {
        return randomFrom(STATION_CONTACT_PORTRAIT_POOLS_BY_SPECIES[originSpecies]);
    }
}
