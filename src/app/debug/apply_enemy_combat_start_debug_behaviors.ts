// src/app/debug/apply_enemy_combat_start_debug_behaviors.ts

import type EncounterEngine from '../../engine/encounter/EncounterEngine';
import {
    ENEMY_DEBUG_BEHAVIORS,
} from './enemy_debug_behaviors';

// Single removable app-side boundary for enemy combat-start debug cheats.
//
// It decides only whether/when to invoke already-authoritative engine actions.
// No debug flags are stored in EncounterState, enemy policy, combat runners or
// gameplay content.
export function applyEnemyCombatStartDebugBehaviors(
    encounterEngine:
        EncounterEngine,
): void {
    if (
        !ENEMY_DEBUG_BEHAVIORS
            .evadeAtCombatStart
    ) {
        return;
    }

    const enemyActorIds =
        encounterEngine
            .getPresentationSnapshot()
            .enemyShips
            .map((enemy) => {
                return enemy.actorId;
            });

    for (
        const actorId
        of enemyActorIds
    ) {
        encounterEngine
            .tryStartActorEvade(
                actorId,
            );
    }
}
