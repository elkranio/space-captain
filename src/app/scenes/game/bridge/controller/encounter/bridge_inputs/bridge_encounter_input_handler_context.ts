// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/bridge_encounter_input_handler_context.ts

import type {
    BridgeOfficerCommandSelectedPayload,
    BridgeOfficerSeatClickedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';

// Контекст для handlers,
// которые обрабатывают bridge input
// и visual-flow events.
//
// Handlers не знают про
// BridgeEncounterController напрямую:
// они проверяют interactivity,
// вызывают app-level действия
// и могут эмитить bridge events.
export type BridgeEncounterInputHandlerContext = {
    eventBus: BridgeEventBus;

    isEncounterInteractive: () => boolean;

    setEncounterInteractive: (value: boolean) => void;

    completeEncounterArrival: () => void;

    // Visual travel завершается
    // только для конкретной runtime task.
    completeEncounterTravel: (taskId: string) => void;

    openOfficerCommandMenu: (role: BridgeOfficerSeatClickedPayload['role']) => void;

    executeCommand: (payload: BridgeOfficerCommandSelectedPayload) => void;
};
