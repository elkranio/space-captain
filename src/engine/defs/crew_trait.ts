// src/engine/defs/crew_trait.ts

import type {
    OfficerRole,
} from './officer';

export const CREW_TRAIT_POLARITY = {
    POSITIVE: 'positive',
    NEGATIVE: 'negative',
} as const;

export type CrewTraitPolarity =
    (typeof CREW_TRAIT_POLARITY)[keyof typeof CREW_TRAIT_POLARITY];

export const CREW_TRAIT_ID = {
    VETERAN: 'veteran',
    HUNGOVER: 'hungover',
} as const;

export type CrewTraitId =
    (typeof CREW_TRAIT_ID)[keyof typeof CREW_TRAIT_ID];

export type CrewTraitDefinition = {
    id: CrewTraitId;
    polarity: CrewTraitPolarity;
};

export const CREW_TRAITS = {
    [CREW_TRAIT_ID.VETERAN]: {
        id: CREW_TRAIT_ID.VETERAN,
        polarity:
            CREW_TRAIT_POLARITY.POSITIVE,
    },

    [CREW_TRAIT_ID.HUNGOVER]: {
        id: CREW_TRAIT_ID.HUNGOVER,
        polarity:
            CREW_TRAIT_POLARITY.NEGATIVE,
    },
} satisfies Record<
    CrewTraitId,
    CrewTraitDefinition
>;

// NPC crew remains an abstract role set.
// Traits describe only functional modifiers
// of a concrete role on this ship.
export type CrewTraitsByRole =
    Partial<
        Record<
            OfficerRole,
            CrewTraitId[]
        >
    >;
