// src/engine/defs/station.ts

import type { CharacterPortraitId } from './character';
import type { SpeciesId } from './species';

// Стабильные id визуальных вариантов станций.
// App-слой мапит эти id на конкретные atlas/frame.
export const STATION_SPRITE_ID = {
    HUMAN_SMALL_00: 'human_small_00',
    HUMAN_SMALL_01: 'human_small_01',

    ALIEN_SMALL_00: 'alien_small_00',
    ALIEN_SMALL_01: 'alien_small_01',
} as const;

export type StationSpriteId = (typeof STATION_SPRITE_ID)[keyof typeof STATION_SPRITE_ID];

// Контактное лицо станции для comms/contact UI.
// Это не вся станция, а тот, кто отвечает игроку в текущем сценарии.
export type StationContactState = {
    name: string;
    portraitId: CharacterPortraitId;
};

// Runtime-состояние станции в encounter.
// id — id конкретной станции в текущем сценарии, spriteId — ссылка на визуальный вариант.
export type StationState = {
    id: string;
    name: string;
    originSpecies: SpeciesId;
    spriteId: StationSpriteId;
    contact: StationContactState;
};
