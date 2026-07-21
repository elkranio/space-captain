// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/travel/handle_encounter_travel_completed.ts

import type { BridgeEncounterTravelCompletedPayload } from '../../../../events/bridge_event';
import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Завершает domain travel
// после окончания viewscreen animation
// и возвращает управление игроку.
//
// View возвращает runtime taskId,
// полученный при запуске animation.
// Handler передаёт его дальше без lookup
// и без догадок о текущей задаче Helm.
export function handleEncounterTravelCompleted(
    payload: BridgeEncounterTravelCompletedPayload,
    context: BridgeEncounterInputHandlerContext,
): void {
    context.completeEncounterTravel(payload.taskId);

    context.setEncounterInteractive(true);
}
