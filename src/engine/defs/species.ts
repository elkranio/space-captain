// src/engine/defs/species.ts

// Стабильные id видов для генерации контента, правил и сохранённого состояния.
// Конкретный внешний вид персонажей и объектов задаётся отдельными portrait/sprite id.
export const SPECIES_ID = {
    HUMAN: 'human',
    ALIEN: 'alien',
} as const;

export type SpeciesId = (typeof SPECIES_ID)[keyof typeof SPECIES_ID];
