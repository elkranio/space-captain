// src/app/scenes/game/bridge/view/objects/BridgeObjectsView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeObjectsAnimationSequencer from './animation/BridgeObjectsAnimationSequencer';
import BridgeObjectSpriteView from './object_sprite/BridgeObjectSpriteView';

// View encounter objects на bridge viewscreen.
// Владеет object views и синхронизирует их по bridge payloads;
// visual sequences вроде arrival/docking выполняет BridgeObjectsAnimationSequencer.
export default class BridgeObjectsView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly objectViews = new Map<string, BridgeObjectSpriteView>();
    private readonly animationSequencer: BridgeObjectsAnimationSequencer;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('objects').add(this.root);

        this.animationSequencer = new BridgeObjectsAnimationSequencer({
            scene: this.scene,
            eventBus: this.eventBus,
            getObjectView: (objectId) => this.objectViews.get(objectId),
            getObjectViews: () => [...this.objectViews.values()],
        });

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, this.prepareObjects, this);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, this.syncObjects, this);
    }

    public destroy(): void {
        this.animationSequencer.destroy();

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_LOADED, this.prepareObjects, this);

        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_UPDATED, this.syncObjects, this);

        for (const view of this.objectViews.values()) {
            view.destroy();
        }

        this.objectViews.clear();
        this.root.destroy(false);
    }

    private prepareObjects(objects: BridgeEncounterObjectPayload[]): void {
        this.animationSequencer.stop();
        this.syncObjectViews(objects);

        for (const view of this.objectViews.values()) {
            view.prepareForArrival();
        }
    }

    private syncObjects(objects: BridgeEncounterObjectPayload[]): void {
        this.animationSequencer.stop();
        this.syncObjectViews(objects);

        for (const view of this.objectViews.values()) {
            view.showNormal();
        }
    }

    private syncObjectViews(objects: BridgeEncounterObjectPayload[]): void {
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
}
