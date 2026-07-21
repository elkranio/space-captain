// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/arrival/handle_encounter_arrival_completed.ts

import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Завершает domain arrival и возвращает управление игроку.
export function handleEncounterArrivalCompleted(context: BridgeEncounterInputHandlerContext): void {
    context.completeEncounterArrival();
    context.setEncounterInteractive(true);
}
