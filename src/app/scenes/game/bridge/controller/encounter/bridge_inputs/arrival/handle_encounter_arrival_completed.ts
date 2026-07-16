// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/arrival/handle_encounter_arrival_completed.ts

import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Обрабатывает завершение bridge arrival animation.
// После arrival flow encounter снова принимает player input.
export function handleEncounterArrivalCompleted(context: BridgeEncounterInputHandlerContext): void {
    context.setEncounterInteractive(true);
}
