// src/engine/encounter/anchors/jump_point_encounter_anchor.ts

import type { JumpPointState } from "../../defs/jump_point";
import { ENCOUNTER_ANCHOR_KIND, type EncounterAnchorBaseState } from "./encounter_anchor";

export type JumpPointEncounterAnchorState = EncounterAnchorBaseState & {
    kind: typeof ENCOUNTER_ANCHOR_KIND.JUMP_POINT;
    jumpPoint: JumpPointState;
};
