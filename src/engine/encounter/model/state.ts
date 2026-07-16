// src/engine/encounter/model/state.ts

import type { SpaceBackgroundId } from '../../defs/space_background';
import type { EncounterObjectState } from './../objects/encounter_object';

export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;
    objects: EncounterObjectState[];
};
