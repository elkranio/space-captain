// src/engine/defs/ship_behavior.ts

export const SHIP_BEHAVIOR_PRESET_ID = {
    STANDARD_COMBAT_00:
        'standard_combat_00',
} as const;

export type ShipBehaviorPresetId =
    (typeof SHIP_BEHAVIOR_PRESET_ID)[
        keyof typeof SHIP_BEHAVIOR_PRESET_ID
    ];

// Content-derived настройки поведения NPC-корабля,
// которые входят в persistent/runtime snapshot.
//
// Mutable память принятых решений живёт отдельно
// в ShipDecisionState.
export type ShipBehaviorState = {
    offensiveTaskDelayMs: number;
};
