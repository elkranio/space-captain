// src/engine/encounter/model/state.ts

import type { SpaceBackgroundId } from '../../defs/space_background';
import type { EncounterObjectState } from '../objects/encounter_object';

// Полный runtime snapshot текущего encounter.
// Здесь хранится только доменное состояние, без Phaser/UI объектов.
export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;
    objects: EncounterObjectState[];
};
