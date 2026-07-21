// src/engine/encounter/model/state.ts
import type { SpaceBackgroundId } from '../../defs/space_background';
import type { EncounterObjectState } from '../objects/encounter_object';
import type { OfficerTaskStates } from './officer_task';

// Полный runtime snapshot текущего encounter.
// Здесь хранится только доменное состояние, без Phaser/UI объектов.
export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;

    // Объект, рядом с которым корабль находится при загрузке encounter.
    arrivalObjectId: string;

    objects: EncounterObjectState[];
    officerTasks: OfficerTaskStates;
};
