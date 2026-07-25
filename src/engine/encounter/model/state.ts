// src/engine/encounter/model/state.ts

import type { PlayerSpaceNavigationState } from '../../defs/player_location';
import type { SpaceBackgroundId } from '../../defs/space_background';
import type { EncounterAnchorState } from '../anchors/encounter_anchor';
import type { OfficerTaskStates } from './officer_task';

// Полный runtime snapshot текущего encounter.
// Здесь хранится только доменное состояние, без Phaser/UI объектов.
export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;
    navigation: PlayerSpaceNavigationState;

    // Пространственные точки текущего encounter:
    // station, beacon, asteroid, jump point.
    anchors: EncounterAnchorState[];

    officerTasks: OfficerTaskStates;
};
