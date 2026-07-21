// src/engine/encounter/objects/asteroid/asteroid_encounter_object.ts
import type { AsteroidState } from '../../../defs/asteroid';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectBaseState } from '../encounter_object';

export type AsteroidEncounterObjectState = EncounterObjectBaseState & {
    kind: typeof ENCOUNTER_OBJECT_KIND.ASTEROID;
    asteroid: AsteroidState;
};
