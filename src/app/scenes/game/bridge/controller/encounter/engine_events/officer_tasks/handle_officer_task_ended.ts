// src/app/scenes/game/bridge/controller/encounter/engine_events/officer_tasks/handle_officer_task_ended.ts

import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { OfficerTaskEndedEvent } from '../../../../../../../../engine/encounter/model/event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Engine task ended
// -> clear bridge activity label.
//
// Presentation читает role
// из единого task snapshot,
// а не из дублирующего event field.
export function handleOfficerTaskEnded(
    event: OfficerTaskEndedEvent,

    context: BridgeEncounterEventHandlerContext,
): void {
    context.eventBus.emit(
        BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED,

        {
            role: event.task.role,
        },
    );
}
