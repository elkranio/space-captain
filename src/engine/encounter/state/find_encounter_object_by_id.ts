// src/engine/encounter/state/find_encounter_object_by_id.ts

import type { EncounterState } from '../model/state';
import type { EncounterObjectState } from '../objects/encounter_object';

// Ищет encounter object по runtime-id внутри текущего encounter state.
// targetId может отсутствовать: не все команды обязаны быть привязаны к объекту.
export function findEncounterObjectById(
    state: EncounterState,
    targetId: string | undefined,
): EncounterObjectState | undefined {
    if (!targetId) {
        return undefined;
    }

    return state.objects.find((object) => object.id === targetId);
}
