// src/app/scenes/game/bridge/view/objects/BridgeObjectsView.ts

import type BridgeScene from '../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeDockingStartedViewState,
    type BridgeEncounterObjectViewState,
} from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { BRIDGE_VIEWSCREEN_RECT } from '../bridge_viewscreen_layout';
import BridgeObjectSpriteView from './BridgeObjectSpriteView';

const ARRIVAL_SCALE_STEPS = [0, 0.06, 0.12, 0.2, 0.32, 0.46, 0.62, 0.78, 0.9, 1] as const;

const ARRIVAL_STEP_DELAY_MS = 100;

const DOCKING_TARGET_SCALE = 8;
const DOCKING_STEP_DELAY_MS = 120;

const DOCKING_POSITION_PROGRESS_STEPS = [0.18, 0.34, 0.5, 0.66, 0.82, 1] as const;

const DOCKING_SCALE_PROGRESS_STEPS = [0.08, 0.18, 0.32, 0.5, 0.68, 0.82, 0.93, 1] as const;

type ObjectRootStartPosition = {
    root: Phaser.GameObjects.Container;
    x: number;
    y: number;
};

export default class BridgeObjectsView {
    // #region Fields
    private readonly root: Phaser.GameObjects.Container;
    private readonly objectViews = new Map<string, BridgeObjectSpriteView>();

    private arrivalTimer?: Phaser.Time.TimerEvent;
    private dockingTimer?: Phaser.Time.TimerEvent;
    // #endregion

    // #region Lifecycle
    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('objects').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, this.prepareObjects, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);

        this.eventBus.on(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);
    }

    public destroy(): void {
        this.stopArrivalTimer();
        this.stopDockingTimer();

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, this.prepareObjects, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);

        this.eventBus.off(BRIDGE_EVENT.DOCKING_STARTED, this.handleDockingStarted, this);

        for (const view of this.objectViews.values()) {
            view.destroy();
        }

        this.objectViews.clear();
        this.root.destroy(true);
    }
    // #endregion

    // #region Object sync
    private prepareObjects(objects: BridgeEncounterObjectViewState[]): void {
        this.stopArrivalTimer();
        this.stopDockingTimer();
        this.syncObjectViews(objects);

        for (const view of this.objectViews.values()) {
            view.prepareForArrival();
        }
    }

    private syncObjects(objects: BridgeEncounterObjectViewState[]): void {
        this.stopArrivalTimer();
        this.stopDockingTimer();
        this.syncObjectViews(objects);

        for (const view of this.objectViews.values()) {
            view.showNormal();
        }
    }

    private syncObjectViews(objects: BridgeEncounterObjectViewState[]): void {
        const activeObjectIds = new Set<string>();

        for (const object of objects) {
            activeObjectIds.add(object.id);

            const existingView = this.objectViews.get(object.id);

            if (existingView) {
                existingView.update(object);
                continue;
            }

            const view = new BridgeObjectSpriteView(this.scene, this.root, object);

            this.objectViews.set(object.id, view);
        }

        for (const [objectId, view] of this.objectViews) {
            if (activeObjectIds.has(objectId)) {
                continue;
            }

            view.destroy();
            this.objectViews.delete(objectId);
        }
    }
    // #endregion

    // #region Arrival animation
    private playArrival(): void {
        this.stopArrivalTimer();
        this.stopDockingTimer();

        const views = [...this.objectViews.values()];

        if (views.length === 0) {
            this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, undefined);
            return;
        }

        for (const view of views) {
            view.showForArrival();
        }

        let stepIndex = 0;

        this.arrivalTimer = this.scene.time.addEvent({
            delay: ARRIVAL_STEP_DELAY_MS,
            repeat: ARRIVAL_SCALE_STEPS.length - 1,
            callback: () => {
                const scale = ARRIVAL_SCALE_STEPS[stepIndex];

                for (const view of views) {
                    view.setArrivalScale(scale);
                }

                stepIndex += 1;

                if (stepIndex >= ARRIVAL_SCALE_STEPS.length) {
                    this.arrivalTimer = undefined;

                    this.eventBus.emit(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, undefined);
                }
            },
        });
    }

    private stopArrivalTimer(): void {
        this.arrivalTimer?.remove(false);
        this.arrivalTimer = undefined;
    }
    // #endregion

    // #region Docking animation
    private handleDockingStarted(payload: BridgeDockingStartedViewState): void {
        this.stopArrivalTimer();
        this.stopDockingTimer();

        const targetView = this.objectViews.get(payload.targetId);

        if (!targetView) {
            console.warn('Cannot start docking animation. Target object not found:', payload);

            this.completeDockingAnimation();
            return;
        }

        this.playDockingXAlign(targetView);
    }

    private playDockingXAlign(targetView: BridgeObjectSpriteView): void {
        const targetRoot = targetView.getRoot();
        const viewscreenCenter = this.getViewscreenCenter();
        const offsetX = viewscreenCenter.x - targetRoot.x;

        const startPositions = this.getObjectRootStartPositions();

        this.playDockingPositionPhase(startPositions, offsetX, 0, () => this.playDockingYAlign(targetView));
    }

    private playDockingYAlign(targetView: BridgeObjectSpriteView): void {
        const targetRoot = targetView.getRoot();
        const viewscreenCenter = this.getViewscreenCenter();
        const offsetY = viewscreenCenter.y - targetRoot.y;

        const startPositions = this.getObjectRootStartPositions();

        this.playDockingPositionPhase(startPositions, 0, offsetY, () => this.playDockingScale(targetView));
    }

    private playDockingPositionPhase(
        startPositions: ObjectRootStartPosition[],
        offsetX: number,
        offsetY: number,
        onComplete: () => void,
    ): void {
        let stepIndex = 0;

        this.dockingTimer = this.scene.time.addEvent({
            delay: DOCKING_STEP_DELAY_MS,
            repeat: DOCKING_POSITION_PROGRESS_STEPS.length - 1,
            callback: () => {
                const progress = DOCKING_POSITION_PROGRESS_STEPS[stepIndex];

                for (const startPosition of startPositions) {
                    startPosition.root.setPosition(
                        startPosition.x + offsetX * progress,
                        startPosition.y + offsetY * progress,
                    );
                }

                stepIndex += 1;

                if (stepIndex >= DOCKING_POSITION_PROGRESS_STEPS.length) {
                    this.dockingTimer = undefined;
                    onComplete();
                }
            },
        });
    }

    private playDockingScale(targetView: BridgeObjectSpriteView): void {
        const targetRoot = targetView.getRoot();
        const startScale = targetRoot.scaleX;
        const scaleDelta = DOCKING_TARGET_SCALE - startScale;

        let stepIndex = 0;

        this.dockingTimer = this.scene.time.addEvent({
            delay: DOCKING_STEP_DELAY_MS,
            repeat: DOCKING_SCALE_PROGRESS_STEPS.length - 1,
            callback: () => {
                const progress = DOCKING_SCALE_PROGRESS_STEPS[stepIndex];
                const scale = startScale + scaleDelta * progress;

                targetRoot.setScale(scale);

                stepIndex += 1;

                if (stepIndex >= DOCKING_SCALE_PROGRESS_STEPS.length) {
                    this.dockingTimer = undefined;
                    this.completeDockingAnimation();
                }
            },
        });
    }

    private completeDockingAnimation(): void {
        this.eventBus.emit(BRIDGE_EVENT.DOCKING_ANIMATION_COMPLETED, undefined);
    }

    private stopDockingTimer(): void {
        this.dockingTimer?.remove(false);
        this.dockingTimer = undefined;
    }

    private getObjectRootStartPositions(): ObjectRootStartPosition[] {
        return [...this.objectViews.values()].map((view) => {
            const root = view.getRoot();

            return {
                root,
                x: root.x,
                y: root.y,
            };
        });
    }

    private getViewscreenCenter(): Phaser.Math.Vector2 {
        return new Phaser.Math.Vector2(
            BRIDGE_VIEWSCREEN_RECT.x + BRIDGE_VIEWSCREEN_RECT.width / 2,
            BRIDGE_VIEWSCREEN_RECT.y + BRIDGE_VIEWSCREEN_RECT.height / 2,
        );
    }
    // #endregion
}
