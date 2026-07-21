// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/travel/handle_encounter_travel_completed.ts

import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Завершает domain travel
// после окончания viewscreen animation
// и возвращает управление игроку.
export function handleEncounterTravelCompleted(context: BridgeEncounterInputHandlerContext): void {
    context.completeEncounterTravel();
    context.setEncounterInteractive(true);
}
