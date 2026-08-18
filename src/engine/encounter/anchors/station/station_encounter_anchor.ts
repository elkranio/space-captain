// src/engine/encounter/anchors/station/station_encounter_anchor.ts

import type { StationState } from "../../../defs/station";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorBaseState } from "../encounter_anchor";

export type StationEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.STATION;
    station: StationState;
};
