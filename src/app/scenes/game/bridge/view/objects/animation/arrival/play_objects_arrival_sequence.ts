// src/app/scenes/game/bridge/view/objects/animation/arrival/play_objects_arrival_sequence.ts

import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';

const ARRIVAL_SCALE_STEPS = [0, 0.06, 0.12, 0.2, 0.32, 0.46, 0.62, 0.78, 0.9, 1] as const;

const ARRIVAL_STEP_DELAY_MS = 100;

// Проигрывает arrival sequence
// для всей визуальной группы target anchor.
export function playObjectsArrivalSequence(targetId: string, context: BridgeObjectsAnimationContext): void {
    const targetViews = getAnchorObjectViewsOrThrow(targetId, context);

    for (const view of targetViews) {
        view.showForArrival();
    }

    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: ARRIVAL_STEP_DELAY_MS,
        repeat: ARRIVAL_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = ARRIVAL_SCALE_STEPS[stepIndex];

            for (const view of targetViews) {
                view.setArrivalScale(scale);
            }

            stepIndex += 1;

            if (stepIndex < ARRIVAL_SCALE_STEPS.length) {
                return;
            }

            context.clearActiveTimer();

            for (const view of targetViews) {
                view.showNormal();
            }

            context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
        },
    });

    context.setActiveTimer(timer);
}

function getAnchorObjectViewsOrThrow(
    anchorObjectId: string,
    context: BridgeObjectsAnimationContext,
): BridgeObjectSpriteView[] {
    const views = context.getAnchorObjectViews(anchorObjectId);

    if (views.length === 0) {
        throw new Error(`Arrival anchor object views not found: ${anchorObjectId}`);
    }

    return views;
}
