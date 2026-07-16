// src/app/scenes/game/bridge/controller/encounter/engine_events/contact/handle_contact_message_added.ts

import type { ContactMessageAddedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine CONTACT_MESSAGE_ADDED в bridge CONTACT_MESSAGE_ADDED.
// View добавит одну новую реплику в active contact panel.
export function handleContactMessageAdded(
    event: ContactMessageAddedEvent,
    context: BridgeEncounterEventHandlerContext,
): void {
    context.eventBus.emit(BRIDGE_EVENT.CONTACT_MESSAGE_ADDED, {
        speakerName: event.speakerName,
        text: event.text,
    });
}
