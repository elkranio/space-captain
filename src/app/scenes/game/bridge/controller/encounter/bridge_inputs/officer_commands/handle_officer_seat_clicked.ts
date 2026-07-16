// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/officer_commands/handle_officer_seat_clicked.ts

import type { BridgeOfficerSeatClickedPayload } from '../../../../events/bridge_event';
import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Обрабатывает клик по officer seat.
// View только сообщает, по кому кликнули; handler запрашивает актуальные команды у encounter flow.
export function handleOfficerSeatClicked(
    payload: BridgeOfficerSeatClickedPayload,
    context: BridgeEncounterInputHandlerContext,
): void {
    if (!context.isEncounterInteractive()) {
        return;
    }

    context.requestOfficerCommands(payload.role);
}
