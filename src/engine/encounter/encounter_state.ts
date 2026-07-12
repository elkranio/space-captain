// src\engine\encounter\encounter_state.ts

import type { SpaceBackgroundId } from '../defs/space_background';
import type { StationState } from '../defs/station';

export type EncounterObjectState = {
    id: string;
    station: StationState;
    position: {
        x: number;
        y: number;
    };
};

export type EncounterState = {
    spaceBackgroundId: SpaceBackgroundId;
    objects: EncounterObjectState[];
};
