// src/app/scenes/game/bridge/controller/encounter/engine_events/contact/handle_contact_started.ts

import type { ContactStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine CONTACT_STARTED в bridge CONTACT_STARTED.
// Bridge view получает готовые данные для открытия contact panel.
export function handleContactStarted(event: ContactStartedEvent, context: BridgeEncounterEventHandlerContext): void {
    context.eventBus.emit(BRIDGE_EVENT.CONTACT_STARTED, {
        contactName: event.contactName,
        contactPortraitId: event.contactPortraitId,
    });
}
