// src/engine/encounter/officer_tasks/advance_officer_tasks.ts

import type { EncounterState } from '../model/state';

// Двигает внутреннее время активных officer task-ов.
// Прогресс пока не показываем игроку, но engine должен знать, когда task дошёл до конца.
export function advanceOfficerTasks(state: EncounterState, deltaMs: number): void {
    for (const task of Object.values(state.officerTasks)) {
        if (!task) continue;

        task.elapsedMs = Math.min(task.elapsedMs + deltaMs, task.durationMs);
    }
}
