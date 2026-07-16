// src/app/scenes/game/bridge/controller/encounter/engine_events/contact/handle_contact_ended.ts

import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine CONTACT_ENDED в bridge CONTACT_ENDED.
// Событие несёт только факт завершения contact flow, payload не нужен.
export function handleContactEnded(context: BridgeEncounterEventHandlerContext): void {
    context.eventBus.emit(BRIDGE_EVENT.CONTACT_ENDED);
}
