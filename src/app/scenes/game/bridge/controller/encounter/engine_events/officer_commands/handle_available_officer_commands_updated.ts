// src/app/scenes/game/bridge/controller/encounter/engine_events/officer_commands/handle_available_officer_commands_updated.ts

import type { AvailableOfficerCommandsUpdatedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import { createOfficerCommandMenuGroups } from '../../officer_commands/create_officer_command_menu_groups';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine AVAILABLE_OFFICER_COMMANDS_UPDATED в bridge OFFICER_COMMAND_MENU_UPDATED.
// Engine отдаёт доступные команды, app/controller слой группирует их в UI-ready menu structure.
export function handleAvailableOfficerCommandsUpdated(
    event: AvailableOfficerCommandsUpdatedEvent,
    context: BridgeEncounterEventHandlerContext,
): void {
    context.eventBus.emit(BRIDGE_EVENT.OFFICER_COMMAND_MENU_UPDATED, {
        role: event.role,
        groups: createOfficerCommandMenuGroups(event.commands),
    });
}
