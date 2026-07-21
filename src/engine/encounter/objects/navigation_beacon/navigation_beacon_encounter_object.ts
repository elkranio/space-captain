// src/engine/encounter/objects/navigation_beacon/navigation_beacon_encounter_object.ts
import type { NavigationBeaconState } from '../../../defs/beacon';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectBaseState } from '../encounter_object';

export type NavigationBeaconEncounterObjectState = EncounterObjectBaseState & {
    kind: typeof ENCOUNTER_OBJECT_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};
