// src/app/scenes/game/bridge/view/objects/animation/BridgeObjectsAnimationSequencer.ts

import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT, type BridgeDockingStartedPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';
import BridgeObjectSpriteView from '../object_sprite/BridgeObjectSpriteView';

const ARRIVAL_SCALE_STEPS = [0, 0.06, 0.12, 0.2, 0.32, 0.46, 0.62, 0.78, 0.9, 1] as const;
const ARRIVAL_STEP_DELAY_MS = 100;

const DOCKING_TARGET_SCALE = 8;
const DOCKING_STEP_DELAY_MS = 120;

const DOCKING_POSITION_PROGRESS_STEPS = [0.18, 0.34, 0.5, 0.66, 0.82, 1] as const;
const DOCKING_SCALE_PROGRESS_STEPS = [0.08, 0.18, 0.32, 0.5, 0.68, 0.82, 0.93, 1] as const;

type ObjectViewStartPosition = {
    view: BridgeObjectSpriteView;
    x: number;
    y: number;
};

export type BridgeObjectsAnimationSequencerContext = {
    scene: BridgeScene;
    eventBus: BridgeEventBus;
    getObjectView: (objectId: string) => BridgeObjectSpriteView | undefined;
    getObjectViews: () => BridgeObjectSpriteView[];
};

// View-level sequencer для animations над encounter objects на bridge viewscreen.
// BridgeObjectsView владеет object views, а этот класс только проигрывает visual sequences.
export default class BridgeObjectsAnimationSequencer {
    private activeTimer?: Phaser.Time.TimerEvent;

    constructor(private readonly context: BridgeObjectsAnimationSequencerContext) {
        this.context.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);

        this.context.eventBus.on(BRIDGE_EVENT.DOCKING_STARTED, this.playDocking, this);
    }

    public stop(): void {
        this.activeTimer?.remove(false);
        this.activeTimer = undefined;
    }

    public destroy(): void {
        this.stop();

        this.context.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);

        this.context.eventBus.off(BRIDGE_EVENT.DOCKING_STARTED, this.playDocking, this);
    }

    private playArrival(): void {
        this.stop();

        const views = this.context.getObjectViews();

        if (views.length === 0) {
            this.context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
            return;
        }

        for (const view of views) {
            view.showForArrival();
        }

        let stepIndex = 0;

        this.activeTimer = this.context.scene.time.addEvent({
            delay: ARRIVAL_STEP_DELAY_MS,
            repeat: ARRIVAL_SCALE_STEPS.length - 1,
            callback: () => {
                const scale = ARRIVAL_SCALE_STEPS[stepIndex];

                for (const view of views) {
                    view.setArrivalScale(scale);
                }

                stepIndex += 1;

                if (stepIndex >= ARRIVAL_SCALE_STEPS.length) {
                    this.activeTimer = undefined;
                    this.context.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED);
                }
            },
        });
    }

    private playDocking(payload: BridgeDockingStartedPayload): void {
        this.stop();

        const targetView = this.context.getObjectView(payload.targetId);

        if (!targetView) {
            console.warn('Cannot start docking animation. Target object not found:', payload);

            this.completeDockingAnimation();
            return;
        }

        this.playDockingXAlign(targetView);
    }

    private playDockingXAlign(targetView: BridgeObjectSpriteView): void {
        const viewscreenCenter = this.getViewscreenCenter();
        const offsetX = viewscreenCenter.x - targetView.getX();

        const startPositions = this.getObjectViewStartPositions();

        this.playDockingPositionPhase(startPositions, offsetX, 0, () => this.playDockingYAlign(targetView));
    }

    private playDockingYAlign(targetView: BridgeObjectSpriteView): void {
        const viewscreenCenter = this.getViewscreenCenter();
        const offsetY = viewscreenCenter.y - targetView.getY();

        const startPositions = this.getObjectViewStartPositions();

        this.playDockingPositionPhase(startPositions, 0, offsetY, () => this.playDockingScale(targetView));
    }

    private playDockingPositionPhase(
        startPositions: ObjectViewStartPosition[],
        offsetX: number,
        offsetY: number,
        onComplete: () => void,
    ): void {
        let stepIndex = 0;

        this.activeTimer = this.context.scene.time.addEvent({
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
                    this.activeTimer = undefined;
                    onComplete();
                }
            },
        });
    }

    private playDockingScale(targetView: BridgeObjectSpriteView): void {
        const startScale = targetView.getScale();
        const scaleDelta = DOCKING_TARGET_SCALE - startScale;

        let stepIndex = 0;

        this.activeTimer = this.context.scene.time.addEvent({
            delay: DOCKING_STEP_DELAY_MS,
            repeat: DOCKING_SCALE_PROGRESS_STEPS.length - 1,
            callback: () => {
                const progress = DOCKING_SCALE_PROGRESS_STEPS[stepIndex];
                const scale = startScale + scaleDelta * progress;

                targetView.setScale(scale);

                stepIndex += 1;

                if (stepIndex >= DOCKING_SCALE_PROGRESS_STEPS.length) {
                    this.activeTimer = undefined;
                    this.completeDockingAnimation();
                }
            },
        });
    }

    private completeDockingAnimation(): void {
        this.context.eventBus.emit(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED);
    }

    private getObjectViewStartPositions(): ObjectViewStartPosition[] {
        return this.context.getObjectViews().map((view) => {
            return {
                view,
                x: view.getX(),
                y: view.getY(),
            };
        });
    }

    private getViewscreenCenter(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2,
            BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height / 2,
        );
    }
}
