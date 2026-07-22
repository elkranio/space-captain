// src/app/scenes/game/bridge/controller/encounter/engine_events/dispatch_encounter_event.ts

import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from './bridge_encounter_event_handler_context';
import { handleEncounterLoaded } from './encounter/handle_encounter_loaded';

// Routing и перевод EncounterEngine events
// в bridge presentation events.
//
// Сложный initial encounter flow
// остаётся в отдельном handler.
//
// Простые одношаговые переводы
// выполняются прямо здесь.
export function dispatchEncounterEvent(event: EncounterEvent, context: BridgeEncounterEventHandlerContext): void {
    switch (event.type) {
        case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
            handleEncounterLoaded(event, context);
            return;

        case ENCOUNTER_EVENT.CONTACT_STARTED:
            context.eventBus.emit(BRIDGE_EVENT.CONTACT_STARTED, {
                contactName: event.contactName,
                contactPortraitId: event.contactPortraitId,
            });
            return;

        case ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED:
            context.eventBus.emit(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, {
                speakerName: event.speakerName,
                text: event.text,
            });
            return;

        case ENCOUNTER_EVENT.CONTACT_ENDED:
            context.eventBus.emit(BRIDGE_EVENT.CONTACT_ENDED);
            return;

        case ENCOUNTER_EVENT.TRAVEL_STARTED:
            context.setEncounterInteractive(false);

            context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, {
                taskId: event.taskId,
                fromObjectId: event.fromObjectId,
                targetObjectId: event.target.id,
            });
            return;

        case ENCOUNTER_EVENT.DOCKING_STARTED:
            context.setEncounterInteractive(false);

            context.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
                targetId: event.targetId,
            });
            return;

        case ENCOUNTER_EVENT.OFFICER_TASK_STARTED:
            context.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_STARTED, {
                role: event.task.role,
                label: event.task.label,
            });
            return;

        case ENCOUNTER_EVENT.OFFICER_TASK_ENDED:
            context.eventBus.emit(BRIDGE_EVENT.OFFICER_ACTIVITY_CLEARED, {
                role: event.task.role,
            });
            return;
    }

    throw new Error(`Unhandled encounter event: ${String(event)}`);
}
