// src/app/scenes/game/bridge/controller/encounter/engine_events/travel/handle_travel_started.ts

import type { TravelStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine TRAVEL_STARTED
// в bridge-level visual travel flow.
//
// Navigation уже переведена engine
// в TRAVELLING и синхронизирована
// с persistent runtime.
//
// Пока animation не завершилась,
// encounter остаётся неинтерактивным,
// а Helm продолжает выполнять задачу.
//
// taskId проходит через bridge event,
// чтобы завершение конкретной animation
// можно было связать с конкретной task instance.
export function handleTravelStarted(
    event: TravelStartedEvent,

    context: BridgeEncounterEventHandlerContext,
): void {
    context.setEncounterInteractive(false);

    context.eventBus.emit(
        BRIDGE_EVENT.ENCOUNTER_TRAVEL_STARTED,

        {
            taskId: event.taskId,

            fromObjectId: event.fromObjectId,

            targetObjectId: event.target.id,
        },
    );
}
