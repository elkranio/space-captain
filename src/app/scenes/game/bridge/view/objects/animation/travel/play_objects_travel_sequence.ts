// src/app/scenes/game/bridge/view/objects/animation/travel/play_objects_travel_sequence.ts

import { BRIDGE_EVENT, type BridgeEncounterTravelStartedPayload } from '../../../../events/bridge_event';
import { BRIDGE_VIEWSCREEN_RECT } from '../../../bridge_viewscreen_layout';
import type BridgeObjectSpriteView from '../../object_sprite/BridgeObjectSpriteView';
import type { BridgeObjectsAnimationContext } from '../bridge_objects_animation_context';
import { playSteppedAnimation } from '../play_stepped_animation';

const TRAVEL_FRAMES_PER_SECOND = 12;

const MIN_TURN_ANGLE_DEGREES = 0.5;

// Примерный горизонтальный угол обзора viewscreen.
// Используется только для screen-space движения объектов.
const VIEW_HORIZONTAL_FOV_DEGREES = 100;

const TURN_MIN_DURATION_MS = 300;
const TURN_MAX_DURATION_MS = 900;

const TURN_OFFSCREEN_MARGIN_PX = 160;

const APPROACH_DURATION_MS = 1000;
const APPROACH_MIN_SCALE = 0.04;

// Fallback для перелёта практически без yaw-разворота.
const FORWARD_DEPARTURE_DURATION_MS = 700;
const FORWARD_DEPARTURE_SCALE = 3;
const FORWARD_DEPARTURE_PUSH_PX = 500;

const MIN_PERSPECTIVE_DEPTH = 0.25;
const MAX_PERSPECTIVE_DEPTH = 4;

const SCALE_QUANTIZATION = 64;

type SourceTurnMotion = {
    view: BridgeObjectSpriteView;

    normalPosition: Phaser.Math.Vector2;

    turnPosition: Phaser.Math.Vector2;
};

type TargetTravelMotion = {
    view: BridgeObjectSpriteView;

    normalPosition: Phaser.Math.Vector2;

    turnStartPosition: Phaser.Math.Vector2;

    turnEndPosition: Phaser.Math.Vector2;

    depth: number;
};

type ForwardDepartureMotion = {
    view: BridgeObjectSpriteView;

    normalPosition: Phaser.Math.Vector2;

    depth: number;
};

// Проигрывает локальный перелёт между anchor groups.
//
// При yaw-развороте:
// - source уходит за край;
// - target одновременно входит с противоположного края;
// - background прокручивается на реальную yaw delta;
// - затем target приближается до normal composition.
//
// При почти нулевом yaw используется forward departure.
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

    if (Math.abs(yawDeltaDegrees) < MIN_TURN_ANGLE_DEGREES) {
        playForwardDeparturePhase(payload.taskId, fromViews, targetViews, context);

        return;
    }

    const turnDirectionX = -Math.sign(yawDeltaDegrees);

    const turnDistance = getTurnTravelDistance(yawDeltaDegrees);

    const sourceMotions = createSourceTurnMotions(fromViews, turnDirectionX, turnDistance);

    const targetMotions = createTargetTravelMotions(targetViews, turnDirectionX, turnDistance);

    playTurnPhase(
        payload.taskId,
        sourceMotions,
        targetMotions,
        currentYawDegrees,
        targetYawDegrees,
        yawDeltaDegrees,
        context,
    );
}

// #region Turn

function playTurnPhase(
    taskId: string,

    sourceMotions: SourceTurnMotion[],

    targetMotions: TargetTravelMotion[],

    currentYawDegrees: number,
    targetYawDegrees: number,
    yawDeltaDegrees: number,

    context: BridgeObjectsAnimationContext,
): void {
    let previousProgress = 0;

    let animatedYawDegrees = currentYawDegrees;

    const angleProgress = Phaser.Math.Clamp(
        Math.abs(yawDeltaDegrees) / 180,

        0,
        1,
    );

    const durationMs = Math.round(Phaser.Math.Linear(TURN_MIN_DURATION_MS, TURN_MAX_DURATION_MS, angleProgress));

    for (const motion of targetMotions) {
        motion.view.showForArrival();
    }

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs,

        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.InOut,

        onStep: (progress) => {
            for (const motion of sourceMotions) {
                const x = Phaser.Math.Linear(motion.normalPosition.x, motion.turnPosition.x, progress);

                const y = Phaser.Math.Linear(motion.normalPosition.y, motion.turnPosition.y, progress);

                setQuantizedTransform(motion.view, x, y, 1);
            }

            for (const motion of targetMotions) {
                const x = Phaser.Math.Linear(motion.turnStartPosition.x, motion.turnEndPosition.x, progress);

                const y = Phaser.Math.Linear(motion.turnStartPosition.y, motion.turnEndPosition.y, progress);

                const scale = Phaser.Math.Linear(0, APPROACH_MIN_SCALE, progress);

                setQuantizedTransform(motion.view, x, y, scale);
            }

            const progressDelta = progress - previousProgress;

            const yawStepDegrees = yawDeltaDegrees * progressDelta;

            context.turnBackgroundYawBy(yawStepDegrees);

            animatedYawDegrees = normalizeYawDegrees(animatedYawDegrees + yawStepDegrees);

            context.setCameraYawDegrees(animatedYawDegrees);

            previousProgress = progress;
        },

        onComplete: () => {
            context.clearActiveTimer();

            context.setCameraYawDegrees(targetYawDegrees);

            for (const motion of sourceMotions) {
                motion.view.prepareForArrival();
            }

            context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_TRAVEL_FLIGHT_STARTED);

            playApproachPhase(taskId, targetMotions, context);
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Forward departure

function playForwardDeparturePhase(
    taskId: string,

    fromViews: BridgeObjectSpriteView[],

    targetViews: BridgeObjectSpriteView[],

    context: BridgeObjectsAnimationContext,
): void {
    const viewscreenCenter = getViewscreenCenter();

    const motions: ForwardDepartureMotion[] = fromViews.map((view) => {
        return {
            view,

            normalPosition: view.getNormalPosition(),

            depth: getPerspectiveDepth(view),
        };
    });

    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs: FORWARD_DEPARTURE_DURATION_MS,

        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.In,

        onStep: (progress) => {
            for (const motion of motions) {
                const depthProgress = getDepthProgress(progress, motion.depth);

                const radialX = motion.normalPosition.x - viewscreenCenter.x;

                const radialY = motion.normalPosition.y - viewscreenCenter.y;

                const radialLength = Math.sqrt(radialX * radialX + radialY * radialY);

                const directionX = radialLength > 0 ? radialX / radialLength : 0;

                const directionY = radialLength > 0 ? radialY / radialLength : 1;

                const pushDistance = FORWARD_DEPARTURE_PUSH_PX * depthProgress * motion.depth;

                const x = motion.normalPosition.x + directionX * pushDistance;

                const y = motion.normalPosition.y + directionY * pushDistance;

                const scale = Phaser.Math.Linear(1, FORWARD_DEPARTURE_SCALE * motion.depth, depthProgress);

                setQuantizedTransform(motion.view, x, y, scale);
            }
        },

        onComplete: () => {
            context.clearActiveTimer();

            for (const motion of motions) {
                motion.view.prepareForArrival();
            }

            context.eventBus.emit(
                BRIDGE_EVENT
                    .ENCOUNTER_TRAVEL_FLIGHT_STARTED,
            );

            const targetMotions = createTargetTravelMotions(targetViews, 0, 0);

            for (const motion of targetMotions) {
                motion.view.showForArrival();

                setQuantizedTransform(
                    motion.view,
                    motion.turnEndPosition.x,
                    motion.turnEndPosition.y,
                    APPROACH_MIN_SCALE,
                );
            }

            playApproachPhase(taskId, targetMotions, context);
        },
    });

    context.setActiveTimer(timer);
}

// #endregion

// #region Approach

function playApproachPhase(
    taskId: string,

    targetMotions: TargetTravelMotion[],

    context: BridgeObjectsAnimationContext,
): void {
    const timer = playSteppedAnimation({
        scene: context.scene,

        durationMs: APPROACH_DURATION_MS,

        framesPerSecond: TRAVEL_FRAMES_PER_SECOND,

        ease: Phaser.Math.Easing.Cubic.Out,

        onStep: (progress) => {
            for (const motion of targetMotions) {
                const depthProgress = getDepthProgress(progress, motion.depth);

                const x = Phaser.Math.Linear(motion.turnEndPosition.x, motion.normalPosition.x, depthProgress);

                const y = Phaser.Math.Linear(motion.turnEndPosition.y, motion.normalPosition.y, depthProgress);

                const scale = Phaser.Math.Linear(APPROACH_MIN_SCALE, 1, depthProgress);

                setQuantizedTransform(motion.view, x, y, scale);
            }
        },

        onComplete: () => {
            context.clearActiveTimer();

            for (const motion of targetMotions) {
                motion.view.showNormal();
            }

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

// #region Motion preparation

function createSourceTurnMotions(
    views: BridgeObjectSpriteView[],

    turnDirectionX: number,
    turnDistance: number,
): SourceTurnMotion[] {
    return views.map((view) => {
        const normalPosition = view.getNormalPosition();

        const depth = getPerspectiveDepth(view);

        return {
            view,
            normalPosition,

            turnPosition: new Phaser.Math.Vector2(
                normalPosition.x + turnDirectionX * turnDistance * depth,

                normalPosition.y,
            ),
        };
    });
}

function createTargetTravelMotions(
    views: BridgeObjectSpriteView[],

    sourceTurnDirectionX: number,
    turnDistance: number,
): TargetTravelMotion[] {
    const viewscreenCenter = getViewscreenCenter();

    return views.map((view) => {
        const normalPosition = view.getNormalPosition();

        const depth = getPerspectiveDepth(view);

        const turnEndPosition = new Phaser.Math.Vector2(
            viewscreenCenter.x + (normalPosition.x - viewscreenCenter.x) * APPROACH_MIN_SCALE,

            viewscreenCenter.y + (normalPosition.y - viewscreenCenter.y) * APPROACH_MIN_SCALE,
        );

        return {
            view,
            normalPosition,
            depth,

            turnStartPosition: new Phaser.Math.Vector2(
                turnEndPosition.x - sourceTurnDirectionX * turnDistance * depth,

                turnEndPosition.y,
            ),

            turnEndPosition,
        };
    });
}

function getTurnTravelDistance(yawDeltaDegrees: number): number {
    const projectedDistance = (Math.abs(yawDeltaDegrees) / VIEW_HORIZONTAL_FOV_DEGREES) * BRIDGE_VIEWSCREEN_RECT.width;

    const maximumDistance = BRIDGE_VIEWSCREEN_RECT.width + TURN_OFFSCREEN_MARGIN_PX;

    return Math.min(projectedDistance, maximumDistance);
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

    // Для ровно 180° сохраняем знак raw delta,
    // чтобы обратный маршрут крутился обратно.
    if (Math.abs(Math.abs(normalizedDelta) - 180) < 0.0001) {
        return rawDelta >= 0 ? 180 : -180;
    }

    return normalizedDelta;
}

function normalizeYawDegrees(yawDegrees: number): number {
    return ((((yawDegrees + 180) % 360) + 360) % 360) - 180;
}

// #endregion

// #region Transform helpers

function setQuantizedTransform(
    view: BridgeObjectSpriteView,

    x: number,
    y: number,
    scale: number,
): void {
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

function getObjectViewOrThrow(
    objectId: string,

    context: BridgeObjectsAnimationContext,
): BridgeObjectSpriteView {
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
