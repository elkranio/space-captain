// src/engine/content/presets/ship_behaviors.ts

import shipBehaviorTuningData from "../data/ship_behaviors.json";
import { SHIP_BEHAVIOR_TUNING_SCHEMA } from "../schemas/ship_behaviors";
import { SHIP_BEHAVIOR_PRESET_ID, type ShipBehaviorState } from "../../defs/ship_behavior";

const SHIP_BEHAVIOR_TUNING = SHIP_BEHAVIOR_TUNING_SCHEMA.parse(shipBehaviorTuningData);

export const STANDARD_COMBAT_SHIP_BEHAVIOR: ShipBehaviorState = {
    ...SHIP_BEHAVIOR_TUNING[SHIP_BEHAVIOR_PRESET_ID.STANDARD_COMBAT_00],
};
