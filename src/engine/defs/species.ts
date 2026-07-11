// src\engine\defs\species.ts

export const SPECIES_ID = {
    HUMAN: 'human',
    ALIEN: 'alien',
} as const;

export type SpeciesId = (typeof SPECIES_ID)[keyof typeof SPECIES_ID];
