// src/engine/encounter/model/ship_decision.ts

// Runtime-память решений конкретного NPC-корабля.
//
// Persistent universe state её не хранит.
// В encounter state лежит только mutable cadence,
// необходимый для воспроизводимого captain loop.
export type ShipDecisionState = {
    decisionTickRemainingMs: number;
};
