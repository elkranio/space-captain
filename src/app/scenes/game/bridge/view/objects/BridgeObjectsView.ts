// src\app\scenes\game\bridge\view\objects\BridgeObjectsView.ts
import { BRIDGE_EVENT, type BridgeEncounterObjectViewState } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import type BridgeScene from '../../BridgeScene';
import BridgeObjectSpriteView from './BridgeObjectSpriteView';

const ARRIVAL_SCALE_STEPS = [0, 0.06, 0.12, 0.2, 0.32, 0.46, 0.62, 0.78, 0.9, 1] as const;

const ARRIVAL_STEP_DELAY_MS = 100;

export default class BridgeObjectsView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly objectViews = new Map<string, BridgeObjectSpriteView>();

    private arrivalTimer?: Phaser.Time.TimerEvent;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('objects').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, this.prepareObjects, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);
    }

    public destroy(): void {
        this.stopArrivalTimer();

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_PREPARED, this.prepareObjects, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.playArrival, this);

        for (const view of this.objectViews.values()) {
            view.destroy();
        }

        this.objectViews.clear();
        this.root.destroy(true);
    }

    private prepareObjects(objects: BridgeEncounterObjectViewState[]): void {
        this.stopArrivalTimer();
        this.syncObjectViews(objects);

        for (const view of this.objectViews.values()) {
            view.prepareForArrival();
        }
    }

    private syncObjects(objects: BridgeEncounterObjectViewState[]): void {
        this.stopArrivalTimer();
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

    private playArrival(): void {
        this.stopArrivalTimer();

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
}
