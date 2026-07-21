// src/app/scenes/game/bridge/controller/encounter/engine_events/travel/handle_travel_started.ts

import type { TravelStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine TRAVEL_STARTED
// в bridge-level visual travel flow.
//
// Пока animation не завершилась,
// encounter остаётся неинтерактивным,
// navigation — TRAVELLING,
// а Helm продолжает выполнять задачу.
export function handleTravelStarted(event: TravelStartedEvent, context: BridgeEncounterEventHandlerContext): void {
    context.setEncounterInteractive(false);

    context.startEncounterTravel(event.fromObjectId, event.target.id);

    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED, {
        fromObjectId: event.fromObjectId,
        targetObjectId: event.target.id,
    });
}
