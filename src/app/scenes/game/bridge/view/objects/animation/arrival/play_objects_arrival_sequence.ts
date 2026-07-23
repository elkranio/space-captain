// src/app/scenes/game/bridge/view/objects/animation/arrival/play_objects_arrival_sequence.ts

import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';
import { playSteppedAnimation } from '../play_stepped_animation';

const ARRIVAL_DURATION_MS = 1000;

const ARRIVAL_FRAMES_PER_SECOND = 12;

// Проигрывает arrival sequence
// для всей визуальной группы target anchor.
//
// Scale вычисляется формулой,
// но обновляется дискретными VGA-style кадрами.
export function playObjectsArrivalSequence(targetId: string, context: BridgeObjectsAnimationContext): void {
    const targetViews = getAnchorObjectViewsOrThrow(targetId, context);

    for (const view of targetViews) {
        view.showForArrival();
    }

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs: ARRIVAL_DURATION_MS,
        framesPerSecond: ARRIVAL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.InOut,

        onStep: (progress) => {
            for (const view of targetViews) {
                view.setArrivalScale(progress);
            }
        },

        onComplete: () => {
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
