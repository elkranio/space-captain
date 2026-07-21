// src/app/scenes/game/bridge/controller/encounter/engine_events/bridge_encounter_event_handler_context.ts

import type BridgeEventBus from '../../../events/BridgeEventBus';

// Контекст для handlers,
// которые переводят EncounterEngine events
// в bridge scene events.
//
// Handlers не знают про
// BridgeEncounterController напрямую:
// только эмитят события,
// меняют interactivity
// и вызывают разрешённые
// encounter lifecycle operations.
export type BridgeEncounterEventHandlerContext = {
    eventBus: BridgeEventBus;

    setEncounterInteractive: (value: boolean) => void;

    completeEncounterArrival: () => void;

    startEncounterTravel: (fromObjectId: string, targetObjectId: string) => void;
};
