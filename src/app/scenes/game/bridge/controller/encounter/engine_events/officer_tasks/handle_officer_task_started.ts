// src/app/scenes/game/bridge/controller/encounter/engine_events/officer_tasks/handle_officer_task_started.ts
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { OfficerTaskStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Engine task started -> bridge activity label.
export function handleOfficerTaskStarted(
    event: OfficerTaskStartedEvent,
    context: BridgeEncounterEventHandlerContext,
): void {
    context.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, {
        role: event.role,
        label: event.label,
    });
}
