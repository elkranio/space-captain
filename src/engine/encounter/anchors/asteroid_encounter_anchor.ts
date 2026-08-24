// src/engine/encounter/anchors/asteroid_encounter_anchor.ts

import type { AsteroidState } from "../../defs/asteroid";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorBaseState } from "./encounter_anchor";

export type AsteroidEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.ASTEROID;
    asteroid: AsteroidState;
};
