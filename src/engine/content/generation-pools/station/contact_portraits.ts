// src/engine/content/generation-pools/station/contact_portraits.ts

import { CHARACTER_PORTRAIT_ID, type CharacterPortraitId } from '../../../defs/character';
import { SPECIES_ID, type SpeciesId } from '../../../defs/species';

export const STATION_CONTACT_PORTRAIT_POOLS_BY_SPECIES = {
    [SPECIES_ID.HUMAN]: [CHARACTER_PORTRAIT_ID.COMMS_HUMAN_00_CALM, CHARACTER_PORTRAIT_ID.COMMS_HUMAN_01_CALM],

    [SPECIES_ID.ALIEN]: [CHARACTER_PORTRAIT_ID.COMMS_ALIEN_00_CALM, CHARACTER_PORTRAIT_ID.COMMS_ALIEN_01_CALM],
} satisfies Record<SpeciesId, readonly CharacterPortraitId[]>;
