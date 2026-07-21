// src/app/scenes/game/bridge/view/objects/animation/arrival/play_objects_arrival_sequence.ts

import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';

const ARRIVAL_SCALE_STEPS = [0, 0.06, 0.12, 0.2, 0.32, 0.46, 0.62, 0.78, 0.9, 1] as const;

const ARRIVAL_STEP_DELAY_MS = 100;

// Проигрывает arrival sequence только для объекта прибытия.
export function playObjectsArrivalSequence(targetId: string, context: BridgeObjectsAnimationContext): void {
    const view = context.getObjectView(targetId);

    if (!view) {
        throw new Error(`Arrival object view not found: ${targetId}`);
    }

    view.showForArrival();

    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: ARRIVAL_STEP_DELAY_MS,
        repeat: ARRIVAL_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = ARRIVAL_SCALE_STEPS[stepIndex];

            view.setArrivalScale(scale);
            stepIndex += 1;

            if (stepIndex >= ARRIVAL_SCALE_STEPS.length) {
                context.clearActiveTimer();

                context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            }
        },
    });

    context.setActiveTimer(timer);
}
