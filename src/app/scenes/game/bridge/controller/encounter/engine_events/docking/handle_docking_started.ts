// src/app/scenes/game/bridge/controller/encounter/engine_events/docking/handle_docking_started.ts

import type { DockingStartedEvent } from '../../../../../../../../engine/encounter/model/event';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterEventHandlerContext } from '../bridge_encounter_event_handler_context';

// Переводит engine DOCKING_STARTED в bridge DOCKING_STARTED.
// На время docking flow bridge encounter становится неинтерактивным.
export function handleDockingStarted(event: DockingStartedEvent, context: BridgeEncounterEventHandlerContext): void {
    context.setEncounterInteractive(false);

    context.eventBus.emit(BRIDGE_EVENT.DOCKING_STARTED, {
        targetId: event.targetId,
    });
}
