// src/app/scenes/game/bridge/view/objects/animation/docking/play_objects_docking_sequence.ts

import { BRIDGE_EVENT, type BridgeDockingStartedPayload } from '../../../../events/bridge_event';
import { BRIDGE_VIEWSCREEN_RECT } from '../../../bridge_viewscreen_layout';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';

const DOCKING_TARGET_SCALE = 8;
const DOCKING_STEP_DELAY_MS = 120;

const DOCKING_POSITION_PROGRESS_STEPS = [0.18, 0.34, 0.5, 0.66, 0.82, 1] as const;
const DOCKING_SCALE_PROGRESS_STEPS = [0.08, 0.18, 0.32, 0.5, 0.68, 0.82, 0.93, 1] as const;

type ObjectViewStartPosition = {
    view: BridgeObjectSpriteView;
    x: number;
    y: number;
};

// Проигрывает docking sequence для encounter object на bridge viewscreen.
// Sequence выравнивает target object по центру, затем визуально приближает его к камере.
export function playObjectsDockingSequence(
    payload: BridgeDockingStartedPayload,
    context: BridgeObjectsAnimationContext,
): void {
    const targetView = context.getObjectView(payload.targetId);

    if (!targetView) {
        console.warn('Cannot start docking animation. Target object not found:', payload);

        completeDockingAnimation(payload.taskId, context);
        return;
    }

    playDockingXAlign(targetView, payload.taskId, context);
}

function playDockingXAlign(
    targetView: BridgeObjectSpriteView,
    taskId: string,
    context: BridgeObjectsAnimationContext,
): void {
    const viewscreenCenter = getViewscreenCenter();
    const offsetX = viewscreenCenter.x - targetView.getX();

    const startPositions = getObjectViewStartPositions(context);

    playDockingPositionPhase(startPositions, offsetX, 0, context, () => {
        playDockingYAlign(targetView, taskId, context);
    });
}

function playDockingYAlign(
    targetView: BridgeObjectSpriteView,
    taskId: string,
    context: BridgeObjectsAnimationContext,
): void {
    const viewscreenCenter = getViewscreenCenter();
    const offsetY = viewscreenCenter.y - targetView.getY();

    const startPositions = getObjectViewStartPositions(context);

    playDockingPositionPhase(startPositions, 0, offsetY, context, () => {
        playDockingScale(targetView, taskId, context);
    });
}

function playDockingPositionPhase(
    startPositions: ObjectViewStartPosition[],
    offsetX: number,
    offsetY: number,
    context: BridgeObjectsAnimationContext,
    onComplete: () => void,
): void {
    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: DOCKING_STEP_DELAY_MS,
        repeat: DOCKING_POSITION_PROGRESS_STEPS.length - 1,
        callback: () => {
            const progress = DOCKING_POSITION_PROGRESS_STEPS[stepIndex];

            for (const startPosition of startPositions) {
                startPosition.view.setPosition(
                    startPosition.x + offsetX * progress,
                    startPosition.y + offsetY * progress,
                );
            }

            stepIndex += 1;

            if (stepIndex >= DOCKING_POSITION_PROGRESS_STEPS.length) {
                context.clearActiveTimer();
                onComplete();
            }
        },
    });

    context.setActiveTimer(timer);
}

function playDockingScale(
    targetView: BridgeObjectSpriteView,
    taskId: string,
    context: BridgeObjectsAnimationContext,
): void {
    const startScale = targetView.getScale();
    const scaleDelta = DOCKING_TARGET_SCALE - startScale;

    let stepIndex = 0;

    const timer = context.scene.time.addEvent({
        delay: DOCKING_STEP_DELAY_MS,
        repeat: DOCKING_SCALE_PROGRESS_STEPS.length - 1,
        callback: () => {
            const progress = DOCKING_SCALE_PROGRESS_STEPS[stepIndex];
            const scale = startScale + scaleDelta * progress;

            targetView.setScale(scale);

            stepIndex += 1;

            if (stepIndex >= DOCKING_SCALE_PROGRESS_STEPS.length) {
                context.clearActiveTimer();
                completeDockingAnimation(taskId, context);
            }
        },
    });

    context.setActiveTimer(timer);
}

function completeDockingAnimation(taskId: string, context: BridgeObjectsAnimationContext): void {
    context.eventBus.emit(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, {
        taskId,
    });
}

function getObjectViewStartPositions(context: BridgeObjectsAnimationContext): ObjectViewStartPosition[] {
    return context.getObjectViews().map((view) => {
        return {
            view,
            x: view.getX(),
            y: view.getY(),
        };
    });
}

function getViewscreenCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2,
        BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height / 2,
    );
}
