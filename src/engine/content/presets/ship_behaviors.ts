// src/engine/content/presets/ship_behaviors.ts

import shipBehaviorTuningData from "../data/ship_behaviors.json";
import { SHIP_BEHAVIOR_TUNING_SCHEMA } from "../schemas/ship_behaviors";
import { SHIP_BEHAVIOR_PRESET_ID, type ShipBehaviorPresetId, type ShipBehaviorState } from "../../defs/ship_behavior";

export { SHIP_BEHAVIOR_PRESET_ID, type ShipBehaviorPresetId } from "../../defs/ship_behavior";

const SHIP_BEHAVIOR_TUNING = SHIP_BEHAVIOR_TUNING_SCHEMA.parse(shipBehaviorTuningData);

export type ShipBehaviorPreset = ShipBehaviorState & {
    id: ShipBehaviorPresetId;
};

export const SHIP_BEHAVIOR_PRESETS = {
    [SHIP_BEHAVIOR_PRESET_ID.STANDARD_COMBAT_00]: {
        id: SHIP_BEHAVIOR_PRESET_ID.STANDARD_COMBAT_00,

        ...SHIP_BEHAVIOR_TUNING[SHIP_BEHAVIOR_PRESET_ID.STANDARD_COMBAT_00],
    },
} satisfies Record<ShipBehaviorPresetId, ShipBehaviorPreset>;
