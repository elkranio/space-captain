// src\engine\encounter\objects\station\station_encounter_object.ts

import type { StationState } from '../../../defs/station';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectBaseState } from '../encounter_object';

export type StationEncounterObjectState = EncounterObjectBaseState & {
    kind: typeof ENCOUNTER_OBJECT_KIND.STATION;
    station: StationState;
};
