// src/app/scenes/game/bridge/view/objects/animation/travel/play_objects_travel_sequence.ts

import { BRIDGE_EVENT, type BridgeEncounterTravelStartedPayload } from '../../../../events/bridge_event';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';

const TRAVEL_STEP_DELAY_MS = 90;

const TRAVEL_EMPTY_SPACE_DELAY_MS = 240;

const DEPARTURE_SCALE_STEPS = [0.82, 0.62, 0.44, 0.28, 0.14, 0] as const;

const ARRIVAL_SCALE_STEPS = [0.08, 0.18, 0.32, 0.5, 0.68, 0.84, 1] as const;

// Проигрывает локальный перелёт
// между двумя anchor groups.
//
// Сейчас визуальное поведение остаётся старым:
// текущая группа уменьшается,
// затем target group появляется издалека.
//
// Следующий change заменит это
// на turn → departure → arrival.
export function playObjectsTravelSequence(
    payload: BridgeEncounterTravelStartedPayload,
    context: BridgeObjectsAnimationContext,
): void {
    if (payload.fromObjectId === payload.targetObjectId) {
        throw new Error(`Cannot travel from encounter object to itself: ${payload.fromObjectId}`);
    }

    const fromViews = getAnchorObjectViewsOrThrow(payload.fromObjectId, context);
    const targetViews = getAnchorObjectViewsOrThrow(payload.targetObjectId, context);

    for (const view of fromViews) {
        view.showNormal();
    }

    for (const view of targetViews) {
        view.prepareForArrival();
    }

    playDeparturePhase(payload.taskId, fromViews, targetViews, context);
}

// #region Travel phases

function playDeparturePhase(
    taskId: string,
    fromViews: BridgeObjectSpriteView[],
    targetViews: BridgeObjectSpriteView[],
    context: BridgeObjectsAnimationContext,
): void {
    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: TRAVEL_STEP_DELAY_MS,
        repeat: DEPARTURE_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = DEPARTURE_SCALE_STEPS[stepIndex];

            for (const view of fromViews) {
                view.setScale(scale);
            }

            stepIndex += 1;

            if (stepIndex < DEPARTURE_SCALE_STEPS.length) {
                return;
            }

            context.clearActiveTimer();

            for (const view of fromViews) {
                view.prepareForArrival();
            }

            playEmptySpacePhase(taskId, targetViews, context);
        },
    });

    context.setActiveTimer(timer);
}

function playEmptySpacePhase(
    taskId: string,
    targetViews: BridgeObjectSpriteView[],
    context: BridgeObjectsAnimationContext,
): void {
    const timer = context.scene.time.delayedCall(TRAVEL_EMPTY_SPACE_DELAY_MS, () => {
        context.clearActiveTimer();

        playArrivalPhase(taskId, targetViews, context);
    });

    context.setActiveTimer(timer);
}

function playArrivalPhase(
    taskId: string,
    targetViews: BridgeObjectSpriteView[],
    context: BridgeObjectsAnimationContext,
): void {
    for (const view of targetViews) {
        view.showForArrival();
    }

    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: TRAVEL_STEP_DELAY_MS,
        repeat: ARRIVAL_SCALE_STEPS.length - 1,

        callback: () => {
            const scale = ARRIVAL_SCALE_STEPS[stepIndex];

            for (const view of targetViews) {
                view.setScale(scale);
            }

            stepIndex += 1;

            if (stepIndex < ARRIVAL_SCALE_STEPS.length) {
                return;
            }

            context.clearActiveTimer();

            for (const view of targetViews) {
                view.showNormal();
            }

            context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
                taskId,
            });
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Anchor lookup

function getAnchorObjectViewsOrThrow(
    anchorObjectId: string,
    context: BridgeObjectsAnimationContext,
): BridgeObjectSpriteView[] {
    const views = context.getAnchorObjectViews(anchorObjectId);

    if (views.length === 0) {
        throw new Error(`Travel anchor object views not found: ${anchorObjectId}`);
    }

    return views;
}

// #endregion
