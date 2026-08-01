// src/engine/defs/ship_behavior.ts

// Content-derived настройки поведения NPC-корабля,
// которые входят в persistent/runtime snapshot.
//
// Mutable память принятых решений живёт отдельно
// в ShipDecisionState.
export type ShipBehaviorState = {
    offensiveTaskDelayMs: number;
};
