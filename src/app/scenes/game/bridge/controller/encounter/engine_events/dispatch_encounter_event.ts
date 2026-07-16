// src/app/scenes/game/bridge/controller/encounter/engine_events/dispatch_encounter_event.ts

import { ENCOUNTER_EVENT, type EncounterEvent } from '../../../../../../../engine/encounter/model/event';
import type { BridgeEncounterEventHandlerContext } from './bridge_encounter_event_handler_context';
import { handleContactEnded } from './contact/handle_contact_ended';
import { handleContactMessageAdded } from './contact/handle_contact_message_added';
import { handleContactStarted } from './contact/handle_contact_started';
import { handleDockingStarted } from './docking/handle_docking_started';
import { handleEncounterLoaded } from './encounter/handle_encounter_loaded';
import { handleAvailableOfficerCommandsUpdated } from './officer_commands/handle_available_officer_commands_updated';

// Routing point для EncounterEngine events.
// Здесь только выбирается handler; сами bridge side effects живут в event-specific файлах.
export function dispatchEncounterEvent(event: EncounterEvent, context: BridgeEncounterEventHandlerContext): void {
    switch (event.type) {
        case ENCOUNTER_EVENT.ENCOUNTER_LOADED:
            handleEncounterLoaded(event, context);
            return;

        case ENCOUNTER_EVENT.AVAILABLE_OFFICER_COMMANDS_UPDATED:
            handleAvailableOfficerCommandsUpdated(event, context);
            return;

        case ENCOUNTER_EVENT.CONTACT_STARTED:
            handleContactStarted(event, context);
            return;

        case ENCOUNTER_EVENT.CONTACT_MESSAGE_ADDED:
            handleContactMessageAdded(event, context);
            return;

        case ENCOUNTER_EVENT.CONTACT_ENDED:
            handleContactEnded(context);
            return;

        case ENCOUNTER_EVENT.DOCKING_STARTED:
            handleDockingStarted(event, context);
            return;
    }

    throw new Error(`Unhandled encounter event: ${String(event)}`);
}
