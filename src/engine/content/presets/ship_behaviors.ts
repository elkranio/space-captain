// src/engine/content/presets/ship_behaviors.ts

import type {
    ShipBehaviorState,
} from '../../defs/ship_behavior';

export const SHIP_BEHAVIOR_PRESET_ID = {
    STANDARD_COMBAT_00:
        'standard_combat_00',
} as const;

export type ShipBehaviorPresetId =
    (typeof SHIP_BEHAVIOR_PRESET_ID)[keyof typeof SHIP_BEHAVIOR_PRESET_ID];

export type ShipBehaviorPreset =
    ShipBehaviorState & {
        id: ShipBehaviorPresetId;
    };

export const SHIP_BEHAVIOR_PRESETS = {
    [SHIP_BEHAVIOR_PRESET_ID.STANDARD_COMBAT_00]: {
        id:
            SHIP_BEHAVIOR_PRESET_ID
                .STANDARD_COMBAT_00,

        offensiveTaskDelayMs: 2000,
    },
} satisfies Record<
    ShipBehaviorPresetId,
    ShipBehaviorPreset
>;
