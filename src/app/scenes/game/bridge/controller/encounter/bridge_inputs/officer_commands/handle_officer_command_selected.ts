// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/officer_commands/handle_officer_command_selected.ts

import { DEBUG_SETTINGS } from '../../../../../../../debug/debug_settings';
import { BRIDGE_EVENT, type BridgeOfficerCommandSelectedPayload } from '../../../../events/bridge_event';
import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Обрабатывает выбор команды в officer context menu.
// Handler не решает, валидна ли команда: engine повторно проверит это внутри execute flow.
export function handleOfficerCommandSelected(
    payload: BridgeOfficerCommandSelectedPayload,
    context: BridgeEncounterInputHandlerContext,
): void {
    if (!context.isEncounterInteractive()) {
        return;
    }

    context.executeOfficerCommand(payload);
    requestOfficerCommandBark(payload, context);
}

function requestOfficerCommandBark(
    payload: BridgeOfficerCommandSelectedPayload,
    context: BridgeEncounterInputHandlerContext,
): void {
    if (!DEBUG_SETTINGS.bridge.officerCommands.showCommandBark) {
        return;
    }

    context.eventBus.emit(BRIDGE_EVENT.OFFICER_BARK_REQUESTED, {
        role: payload.role,
        text: DEBUG_SETTINGS.bridge.officerCommands.commandBarkText,
    });
}
