// src/app/scenes/game/bridge/controller/encounter/engine_events/bridge_encounter_event_handler_context.ts

import type BridgeEventBus from '../../../events/BridgeEventBus';

// Контекст для handlers,
// которые переводят EncounterEngine events
// в bridge scene events.
//
// Engine-event handlers
// не вызывают domain operations:
// только эмитят presentation events
// и управляют interactivity.
export type BridgeEncounterEventHandlerContext = {
    eventBus: BridgeEventBus;

    setEncounterInteractive: (value: boolean) => void;
};
