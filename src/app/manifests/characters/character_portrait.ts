// src/app/manifests/characters/character_portrait.ts
import { CHARACTER_PORTRAIT_ID, type CharacterPortraitId } from '../../../engine/defs/character';
import { DEFAULT_ATLAS_KEY, type SpriteEntry } from '../types';

export const CHARACTER_PORTRAIT_SPRITES = {
    [CHARACTER_PORTRAIT_ID.COMMS_ALIEN_00_CALM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'characters/comms/alien_00_calm',
    },
    [CHARACTER_PORTRAIT_ID.COMMS_ALIEN_01_CALM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'characters/comms/alien_01_calm',
    },

    [CHARACTER_PORTRAIT_ID.COMMS_HUMAN_00_CALM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'characters/comms/human_00_calm',
    },
    [CHARACTER_PORTRAIT_ID.COMMS_HUMAN_01_CALM]: {
        atlasKey: DEFAULT_ATLAS_KEY,
        frameKey: 'characters/comms/human_01_calm',
    },
} satisfies Record<CharacterPortraitId, SpriteEntry>;
