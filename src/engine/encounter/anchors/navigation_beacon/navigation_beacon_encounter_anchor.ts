// src/engine/encounter/anchors/navigation_beacon/navigation_beacon_encounter_anchor.ts

import type { NavigationBeaconState } from "../../../defs/beacon";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorBaseState } from "../encounter_anchor";

export type NavigationBeaconEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.NAVIGATION_BEACON;
    beacon: NavigationBeaconState;
};
