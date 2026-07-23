// src/app/scenes/game/bridge/view/objects/animation/travel/play_objects_travel_sequence.ts

import { BRIDGE_EVENT, type BridgeEncounterTravelStartedPayload } from '../../../../events/bridge_event';
import { BRIDGE_VIEWSCREEN_RECT } from '../../../bridge_viewscreen_layout';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';
import { playSteppedAnimation } from '../play_stepped_animation';

const TRAVEL_FRAMES_PER_SECOND = 12;

const MIN_TURN_ANGLE_DEGREES = 0.5;

const TURN_MIN_DURATION_MS = 250;
const TURN_MAX_DURATION_MS = 700;

// Сдвиг текущего anchor при развороте на 180°.
const TURN_SHIFT_FOR_HALF_TURN_PX = 240;

// Сдвиг панорамы при развороте на 180°.
// Это намеренно слабый visual parallax, а не физически точная проекция.
const BACKGROUND_PAN_FOR_HALF_TURN_PX = 100;

const TURN_SCALE_DELTA_FOR_HALF_TURN = 0.08;

const DEPARTURE_DURATION_MS = 800;
const DEPARTURE_PUSH_PX = 720;
const DEPARTURE_RADIAL_EXPANSION = 1.2;
const DEPARTURE_TARGET_SCALE = 3;

const EMPTY_SPACE_DURATION_MS = 120;

const ARRIVAL_DURATION_MS = 1000;
const ARRIVAL_MIN_SCALE = 0.04;

const MIN_PERSPECTIVE_DEPTH = 0.25;
const MAX_PERSPECTIVE_DEPTH = 4;

const SCALE_QUANTIZATION = 64;

type TravelObjectMotion = {
    view: BridgeObjectSpriteView;

    normalPosition: Phaser.Math.Vector2;
    turnPosition: Phaser.Math.Vector2;

    depth: number;
    turnScale: number;
};

// Проигрывает локальный перелёт
// между двумя visual anchor groups.
//
// TURN использует geometry x/z:
// - текущий camera yaw хранится между перелётами;
// - target yaw вычисляется из from → target;
// - выбирается кратчайший signed-разворот;
// - anchor и панорама смещаются пропорционально углу.
//
// Координата y и pitch пока не участвуют.
// Это отдельный следующий слой, если он понадобится.
export function playObjectsTravelSequence(
    payload: BridgeEncounterTravelStartedPayload,
    context: BridgeObjectsAnimationContext,
): void {
    if (payload.fromObjectId === payload.targetObjectId) {
        throw new Error(`Cannot travel from encounter object to itself: ${payload.fromObjectId}`);
    }

    const fromAnchorView = getObjectViewOrThrow(payload.fromObjectId, context);

    const targetAnchorView = getObjectViewOrThrow(payload.targetObjectId, context);

    const fromViews = getAnchorObjectViewsOrThrow(payload.fromObjectId, context);

    const targetViews = getAnchorObjectViewsOrThrow(payload.targetObjectId, context);

    for (const view of fromViews) {
        view.showNormal();
    }

    for (const view of targetViews) {
        view.prepareForArrival();
    }

    const currentYawDegrees = context.getCameraYawDegrees() ?? getInitialAnchorYawDegrees(fromAnchorView);

    context.setCameraYawDegrees(currentYawDegrees);

    const targetYawDegrees = getTravelYawDegrees(fromAnchorView, targetAnchorView, currentYawDegrees);

    const yawDeltaDegrees = getShortestYawDeltaDegrees(currentYawDegrees, targetYawDegrees);

    const turnAngleProgress = Phaser.Math.Clamp(Math.abs(yawDeltaDegrees) / 180, 0, 1);

    // Positive yaw означает поворот камеры вправо.
    // Мир при этом уезжает влево.
    const turnShiftDirection = new Phaser.Math.Vector2(-Math.sign(yawDeltaDegrees), 0);

    const departureDirection = getDepartureDirection(turnShiftDirection, fromAnchorView);

    const fromMotions = createTravelObjectMotions(fromViews, turnShiftDirection, turnAngleProgress);

    if (Math.abs(yawDeltaDegrees) < MIN_TURN_ANGLE_DEGREES) {
        context.setCameraYawDegrees(targetYawDegrees);

        playDeparturePhase(payload.taskId, fromMotions, targetViews, departureDirection, context);

        return;
    }

    playTurnPhase(
        payload.taskId,
        fromMotions,
        targetViews,
        currentYawDegrees,
        targetYawDegrees,
        yawDeltaDegrees,
        turnAngleProgress,
        departureDirection,
        context,
    );
}

// #region Turn

function playTurnPhase(
    taskId: string,
    fromMotions: TravelObjectMotion[],
    targetViews: BridgeObjectSpriteView[],
    currentYawDegrees: number,
    targetYawDegrees: number,
    yawDeltaDegrees: number,
    turnAngleProgress: number,
    departureDirection: Phaser.Math.Vector2,
    context: BridgeObjectsAnimationContext,
): void {
    let previousProgress = 0;
    let animatedYawDegrees = currentYawDegrees;

    const durationMs = Math.round(Phaser.Math.Linear(TURN_MIN_DURATION_MS, TURN_MAX_DURATION_MS, turnAngleProgress));

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs,
        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.InOut,

        onStep: (progress) => {
            for (const motion of fromMotions) {
                const x = Phaser.Math.Linear(motion.normalPosition.x, motion.turnPosition.x, progress);

                const y = Phaser.Math.Linear(motion.normalPosition.y, motion.turnPosition.y, progress);

                const scale = Phaser.Math.Linear(1, motion.turnScale, progress);

                setQuantizedTransform(motion.view, x, y, scale);
            }

            const progressDelta = progress - previousProgress;

            const yawStepDegrees = yawDeltaDegrees * progressDelta;

            // Positive camera yaw поворачивает вправо,
            // поэтому panorama визуально сдвигается влево.
            const backgroundScreenX = (-yawStepDegrees / 180) * BACKGROUND_PAN_FOR_HALF_TURN_PX;

            context.panBackgroundBy(backgroundScreenX, 0);

            animatedYawDegrees = normalizeYawDegrees(animatedYawDegrees + yawStepDegrees);

            context.setCameraYawDegrees(animatedYawDegrees);

            previousProgress = progress;
        },

        onComplete: () => {
            context.clearActiveTimer();

            // Убираем возможную накопленную погрешность.
            context.setCameraYawDegrees(targetYawDegrees);

            playDeparturePhase(taskId, fromMotions, targetViews, departureDirection, context);
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Departure

function playDeparturePhase(
    taskId: string,
    fromMotions: TravelObjectMotion[],
    targetViews: BridgeObjectSpriteView[],
    departureDirection: Phaser.Math.Vector2,
    context: BridgeObjectsAnimationContext,
): void {
    const viewscreenCenter = getViewscreenCenter();

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs: DEPARTURE_DURATION_MS,
        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.In,

        onStep: (progress) => {
            for (const motion of fromMotions) {
                const depthProgress = getDepthProgress(progress, motion.depth);

                const radialX = motion.turnPosition.x - viewscreenCenter.x;

                const radialY = motion.turnPosition.y - viewscreenCenter.y;

                const pushDistance = DEPARTURE_PUSH_PX * depthProgress * motion.depth;

                const radialExpansion = DEPARTURE_RADIAL_EXPANSION * depthProgress * motion.depth;

                const x = motion.turnPosition.x + departureDirection.x * pushDistance + radialX * radialExpansion;

                const y = motion.turnPosition.y + departureDirection.y * pushDistance + radialY * radialExpansion;

                const targetScale = Math.max(motion.turnScale, DEPARTURE_TARGET_SCALE * motion.depth);

                const scale = Phaser.Math.Linear(motion.turnScale, targetScale, depthProgress);

                setQuantizedTransform(motion.view, x, y, scale);
            }
        },

        onComplete: () => {
            context.clearActiveTimer();

            for (const motion of fromMotions) {
                motion.view.prepareForArrival();
            }

            playEmptySpacePhase(taskId, targetViews, context);
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Empty space

function playEmptySpacePhase(
    taskId: string,
    targetViews: BridgeObjectSpriteView[],
    context: BridgeObjectsAnimationContext,
): void {
    const timer = context.scene.time.delayedCall(
        EMPTY_SPACE_DURATION_MS,

        () => {
            context.clearActiveTimer();

            playArrivalPhase(taskId, targetViews, context);
        },
    );

    context.setActiveTimer(timer);
}

// #endregion

// #region Arrival

function playArrivalPhase(
    taskId: string,
    targetViews: BridgeObjectSpriteView[],
    context: BridgeObjectsAnimationContext,
): void {
    const viewscreenCenter = getViewscreenCenter();

    const targetMotions = targetViews.map((view) => {
        return {
            view,

            normalPosition: view.getNormalPosition(),

            depth: getPerspectiveDepth(view),
        };
    });

    for (const motion of targetMotions) {
        motion.view.showForArrival();
    }

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs: ARRIVAL_DURATION_MS,
        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.Out,

        onStep: (progress) => {
            for (const motion of targetMotions) {
                const depthProgress = getDepthProgress(progress, motion.depth);

                const x = Phaser.Math.Linear(viewscreenCenter.x, motion.normalPosition.x, depthProgress);

                const y = Phaser.Math.Linear(viewscreenCenter.y, motion.normalPosition.y, depthProgress);

                const scale = Phaser.Math.Linear(ARRIVAL_MIN_SCALE, 1, depthProgress);

                setQuantizedTransform(motion.view, x, y, scale);
            }
        },

        onComplete: () => {
            context.clearActiveTimer();

            for (const motion of targetMotions) {
                motion.view.showNormal();
            }

            context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_COMPLETED, {
                taskId,
            });
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Motion preparation

function createTravelObjectMotions(
    views: BridgeObjectSpriteView[],
    turnShiftDirection: Phaser.Math.Vector2,
    turnAngleProgress: number,
): TravelObjectMotion[] {
    const turnShiftDistance = TURN_SHIFT_FOR_HALF_TURN_PX * turnAngleProgress;

    return views.map((view) => {
        const normalPosition = view.getNormalPosition();

        const depth = getPerspectiveDepth(view);

        return {
            view,
            normalPosition,

            turnPosition: new Phaser.Math.Vector2(
                normalPosition.x + turnShiftDirection.x * turnShiftDistance * depth,

                normalPosition.y + turnShiftDirection.y * turnShiftDistance * depth,
            ),

            depth,

            turnScale: 1 + TURN_SCALE_DELTA_FOR_HALF_TURN * turnAngleProgress * depth,
        };
    });
}

// #endregion

// #region Yaw

function getInitialAnchorYawDegrees(anchorView: BridgeObjectSpriteView): number {
    const position = anchorView.getLocalPosition();

    if (position.x === 0 && position.z === 0) {
        return 0;
    }

    return getYawDegrees(position.x, position.z);
}

function getTravelYawDegrees(
    fromView: BridgeObjectSpriteView,
    targetView: BridgeObjectSpriteView,
    fallbackYawDegrees: number,
): number {
    const fromPosition = fromView.getLocalPosition();

    const targetPosition = targetView.getLocalPosition();

    const deltaX = targetPosition.x - fromPosition.x;

    const deltaZ = targetPosition.z - fromPosition.z;

    if (deltaX === 0 && deltaZ === 0) {
        return fallbackYawDegrees;
    }

    return getYawDegrees(deltaX, deltaZ);
}

function getYawDegrees(x: number, z: number): number {
    return normalizeYawDegrees((Math.atan2(x, z) * 180) / Math.PI);
}

function getShortestYawDeltaDegrees(fromYawDegrees: number, targetYawDegrees: number): number {
    const rawDelta = targetYawDegrees - fromYawDegrees;

    const normalizedDelta = normalizeYawDegrees(rawDelta);

    // Ровно 180° можно пройти в обе стороны.
    // Сохраняем знак исходной разницы,
    // чтобы обратный маршрут разворачивался обратно.
    if (Math.abs(Math.abs(normalizedDelta) - 180) < 0.0001) {
        return rawDelta >= 0 ? 180 : -180;
    }

    return normalizedDelta;
}

function normalizeYawDegrees(yawDegrees: number): number {
    return ((((yawDegrees + 180) % 360) + 360) % 360) - 180;
}

// #endregion

// #region Direction

function getDepartureDirection(
    turnShiftDirection: Phaser.Math.Vector2,
    fromAnchorView: BridgeObjectSpriteView,
): Phaser.Math.Vector2 {
    if (turnShiftDirection.lengthSq() > 0) {
        return turnShiftDirection.clone().normalize();
    }

    const viewscreenCenter = getViewscreenCenter();

    const normalPosition = fromAnchorView.getNormalPosition();

    const radialDirection = new Phaser.Math.Vector2(
        normalPosition.x - viewscreenCenter.x,

        normalPosition.y - viewscreenCenter.y,
    );

    if (radialDirection.lengthSq() > 0) {
        return radialDirection.normalize();
    }

    return new Phaser.Math.Vector2(0, 1);
}

// #endregion

// #region Transform helpers

function setQuantizedTransform(view: BridgeObjectSpriteView, x: number, y: number, scale: number): void {
    view.setPosition(Math.round(x), Math.round(y));

    view.setScale(Math.round(scale * SCALE_QUANTIZATION) / SCALE_QUANTIZATION);
}

function getDepthProgress(progress: number, depth: number): number {
    return Math.pow(progress, 1 / depth);
}

function getPerspectiveDepth(view: BridgeObjectSpriteView): number {
    return Phaser.Math.Clamp(view.getPerspectiveDepth(), MIN_PERSPECTIVE_DEPTH, MAX_PERSPECTIVE_DEPTH);
}

function getViewscreenCenter(): Phaser.Math.Vector2 {
    return new Phaser.Math.Vector2(
        BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2,

        BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height / 2,
    );
}

// #endregion

// #region Object lookup

function getObjectViewOrThrow(objectId: string, context: BridgeObjectsAnimationContext): BridgeObjectSpriteView {
    const view = context.getObjectView(objectId);

    if (!view) {
        throw new Error(`Travel navigation object view not found: ${objectId}`);
    }

    return view;
}

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
