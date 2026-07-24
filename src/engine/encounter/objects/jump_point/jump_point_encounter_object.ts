// src/engine/encounter/objects/jump_point/jump_point_encounter_object.ts

import type { JumpPointState } from '../../../defs/jump_point';
import { ENCOUNTER_OBJECT_KIND, type EncounterObjectBaseState } from '../encounter_object';

export type JumpPointEncounterObjectState = EncounterObjectBaseState & {
    kind: typeof ENCOUNTER_OBJECT_KIND.JUMP_POINT;

    jumpPoint: JumpPointState;
};
