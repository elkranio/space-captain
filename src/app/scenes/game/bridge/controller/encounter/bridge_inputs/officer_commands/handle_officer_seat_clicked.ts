// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/officer_commands/handle_officer_seat_clicked.ts

import type { BridgeOfficerSeatClickedPayload } from '../../../../events/bridge_event';
import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Обрабатывает клик по officer seat.
//
// View только сообщает,
// по какому officer seat кликнули.
//
// Handler открывает меню,
// построенное из актуальных
// encounter commands.
export function handleOfficerSeatClicked(
    payload: BridgeOfficerSeatClickedPayload,

    context: BridgeEncounterInputHandlerContext,
): void {
    if (!context.isEncounterInteractive()) {
        return;
    }

    context.openOfficerCommandMenu(payload.role);
}
