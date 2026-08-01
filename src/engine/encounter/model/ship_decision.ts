// src/engine/encounter/model/ship_decision.ts

import type {
    OfficerRole,
} from '../../defs/officer';

// Runtime-память policy конкретного NPC-корабля.
//
// Она лежит в encounter state, а не внутри runner,
// чтобы решения оставались явными и воспроизводимыми.
export type ShipDecisionState = {
    nextWeaponIndexByRole:
        Partial<Record<OfficerRole, number>>;

    // Блокирует только новые offensive tasks.
    // Защитные и ремонтные решения позже
    // не должны проверять этот timer.
    offensiveTaskDelayRemainingMsByRole:
        Partial<Record<OfficerRole, number>>;
};
