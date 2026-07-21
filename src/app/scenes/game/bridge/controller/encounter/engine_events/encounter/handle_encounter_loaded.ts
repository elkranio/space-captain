// src/app/scenes/game/bridge/controller/encounter/engine_events/encounter/handle_encounter_loaded.ts

import type { EncounterLoadedEvent } from '../../../../../../../../engine/encounter/model/event';
import { DEBUG_SETTINGS } from '../../../../../../../debug/debug_settings';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import { mapEncounterObjectsToBridgeObjectPayloads } from '../../objects/map_encounter_objects_to_bridge_object_payloads';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine ENCOUNTER_LOADED в initial bridge objects flow.
// При загрузке показывается только объект прибытия текущей ноды.
export function handleEncounterLoaded(event: EncounterLoadedEvent, context: BridgeEncounterEventHandlerContext): void {
    const objects = mapEncounterObjectsToBridgeObjectPayloads(event.state);

    const arrivalObject = objects.find((object) => object.id === event.state.arrivalObjectId);

    if (!arrivalObject) {
        throw new Error(`Arrival encounter object not found: ${event.state.arrivalObjectId}`);
    }

    if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
        context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, [arrivalObject]);

        context.setEncounterInteractive(true);
        return;
    }

    context.setEncounterInteractive(false);

    // Все encounter objects создаются заранее, но остаются скрытыми.
    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);

    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, {
        targetId: event.state.arrivalObjectId,
    });
}
