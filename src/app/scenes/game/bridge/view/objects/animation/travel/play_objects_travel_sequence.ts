// src/app/scenes/game/bridge/view/objects/animation/travel/play_objects_travel_sequence.ts

import { BRIDGE_EVENT, type BridgeEncounterTravelStartedPayload } from '../../../../events/bridge_event';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';

const TRAVEL_STEP_DELAY_MS = 90;

const TRAVEL_EMPTY_SPACE_DELAY_MS = 240;

const DEPARTURE_SCALE_STEPS = [0.82, 0.62, 0.44, 0.28, 0.14, 0] as const;

const ARRIVAL_SCALE_STEPS = [0.08, 0.18, 0.32, 0.5, 0.68, 0.84, 1] as const;

// Проигрывает локальный перелёт
// между двумя encounter objects.
//
// Сначала текущий anchor удаляется вдаль,
// затем после короткой пустой фазы
// target появляется издалека.
//
// taskId проходит через весь visual flow
// и возвращается controller-у
// после завершения animation.
export function playObjectsTravelSequence(
    payload: BridgeEncounterTravelStartedPayload,

    context: BridgeObjectsAnimationContext,
): void {
    if (payload.fromObjectId === payload.targetObjectId) {
        throw new Error(`Cannot travel from encounter object to itself: ${payload.fromObjectId}`);
    }

    const fromView = getObjectViewOrThrow(payload.fromObjectId, context);

    const targetView = getObjectViewOrThrow(payload.targetObjectId, context);

    fromView.showNormal();
    targetView.prepareForArrival();

    playDeparturePhase(payload.taskId, fromView, targetView, context);
}

// #region Travel phases

function playDeparturePhase(
    taskId: string,

    fromView: BridgeObjectSpriteView,

    targetView: BridgeObjectSpriteView,

    context: BridgeObjectsAnimationContext,
): void {
    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: TRAVEL_STEP_DELAY_MS,

        repeat: DEPARTURE_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = DEPARTURE_SCALE_STEPS[stepIndex];

            fromView.setScale(scale);

            stepIndex += 1;

            if (stepIndex < DEPARTURE_SCALE_STEPS.length) {
                return;
            }

            context.clearActiveTimer();

            fromView.prepareForArrival();

            playEmptySpacePhase(taskId, targetView, context);
        },
    });

    context.setActiveTimer(timer);
}

function playEmptySpacePhase(
    taskId: string,

    targetView: BridgeObjectSpriteView,

    context: BridgeObjectsAnimationContext,
): void {
    const timer = context.scene.time.delayedCall(
        TRAVEL_EMPTY_SPACE_DELAY_MS,

        () => {
            context.clearActiveTimer();

            playArrivalPhase(taskId, targetView, context);
        },
    );

    context.setActiveTimer(timer);
}

function playArrivalPhase(
    taskId: string,

    targetView: BridgeObjectSpriteView,

    context: BridgeObjectsAnimationContext,
): void {
    targetView.showForArrival();

    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: TRAVEL_STEP_DELAY_MS,

        repeat: ARRIVAL_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = ARRIVAL_SCALE_STEPS[stepIndex];

            targetView.setScale(scale);

            stepIndex += 1;

            if (stepIndex < ARRIVAL_SCALE_STEPS.length) {
                return;
            }

            context.clearActiveTimer();

            targetView.showNormal();

            context.eventBus.emit(
                BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED,

                {
                    taskId,
                },
            );
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Object lookup

function getObjectViewOrThrow(
    objectId: string,

    context: BridgeObjectsAnimationContext,
): BridgeObjectSpriteView {
    const view = context.getObjectView(objectId);

    if (!view) {
        throw new Error(`Travel object view not found: ${objectId}`);
    }

    return view;
}

// #endregion
