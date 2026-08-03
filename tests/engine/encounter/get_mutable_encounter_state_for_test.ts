// tests/engine/encounter/get_mutable_encounter_state_for_test.ts

import type EncounterEngine from '../../../src/engine/encounter/EncounterEngine';
import type { EncounterState } from '../../../src/engine/encounter/model/state';

type EngineWithStateStore = {
    stateStore: {
        getState(): EncounterState;
    };
};

// Explicit white-box test seam.
//
// Runtime code must use detached EncounterEngine reads. A few headless tests
// intentionally arrange mid-encounter state directly; keep that dependency in
// one test-only helper instead of treating ENCOUNTER_LOADED as a mutable handle.
export function getMutableEncounterStateForTest(
    engine: EncounterEngine,
): EncounterState {
    return (engine as unknown as EngineWithStateStore)
        .stateStore
        .getState();
}
