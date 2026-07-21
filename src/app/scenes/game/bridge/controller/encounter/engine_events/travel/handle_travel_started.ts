// src/app/scenes/game/bridge/controller/encounter/engine_events/travel/handle_travel_started.ts

import type { TravelStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import { mapEncounterObjectToBridgeObjectPayload } from '../../objects/map_encounter_objects_to_bridge_object_payloads';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Временный технический travel flow.
//
// Позже мгновенная смена presentation будет заменена
// полноценной анимацией перелёта между объектами.
export function handleTravelStarted(event: TravelStartedEvent, context: BridgeEncounterEventHandlerContext): void {
    context.setEncounterInteractive(false);

    context.startEncounterTravel(event.fromObjectId, event.target.id);

    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [
        mapEncounterObjectToBridgeObjectPayload(event.target),
    ]);

    context.completeEncounterTravel();
    context.setEncounterInteractive(true);
}
