// src/app/scenes/game/bridge/controller/encounter/engine_events/encounter/handle_encounter_loaded.ts

import type { EncounterLoadedEvent } from '../../../../../../../../engine/encounter/model/event';
import { DEBUG_SETTINGS } from '../../../../../../../debug/debug_settings';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import { mapEncounterObjectsToBridgeObjectPayloads } from '../../objects/map_encounter_objects_to_bridge_object_payloads';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine ENCOUNTER_LOADED в initial bridge objects flow.
// В обычном режиме запускает arrival animation, в debug-режиме сразу делает encounter интерактивным.
export function handleEncounterLoaded(event: EncounterLoadedEvent, context: BridgeEncounterEventHandlerContext): void {
    const objects = mapEncounterObjectsToBridgeObjectPayloads(event.state);

    if (DEBUG_SETTINGS.bridge.encounter.skipArrival) {
        context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, objects);
        context.setEncounterInteractive(true);
        return;
    }

    context.setEncounterInteractive(false);

    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, objects);
    context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED);
}
