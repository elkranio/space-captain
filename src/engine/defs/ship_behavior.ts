// src/engine/defs/ship_behavior.ts

export const SHIP_BEHAVIOR_PRESET_ID = {
    STANDARD_COMBAT_00: "standard_combat_00",
} as const;

export type ShipBehaviorPresetId = (typeof SHIP_BEHAVIOR_PRESET_ID)[keyof typeof SHIP_BEHAVIOR_PRESET_ID];

// Content-derived настройки поведения NPC-капитана,
// которые входят в persistent/runtime snapshot.
//
// Здесь живёт профиль конкретного behavior preset:
// cadence решений, допустимая неточность оценки
// и склонность к агрессии.
//
// Общие правила enemy AI живут отдельно
// в enemy_behavior_rules.
//
export type ShipBehaviorState = {
    decisionTickDurationMs: number;
    decisionTickWiggleMs: number;
    threatTimingWiggleMs: number;

    // Designer-facing шкала 0..100.
    aggression: number;
};
