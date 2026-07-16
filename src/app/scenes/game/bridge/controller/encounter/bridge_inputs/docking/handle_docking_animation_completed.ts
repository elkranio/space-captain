// src/app/scenes/game/bridge/controller/encounter/bridge_inputs/docking/handle_docking_animation_completed.ts

import { SCENE_KEY } from '../../../../../../scene_key';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeEncounterInputHandlerContext } from '../bridge_encounter_input_handler_context';

// Обрабатывает завершение docking animation.
// Handler не запускает Phaser scene напрямую, а просит root bridge controller сделать transition.
export function handleDockingAnimationCompleted(context: BridgeEncounterInputHandlerContext): void {
    context.eventBus.emit(BRIDGE_EVENT.SCENE_TRANSITION_REQUESTED, {
        sceneKey: SCENE_KEY.END,
    });
}
