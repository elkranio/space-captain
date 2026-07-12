// src\app\scenes\game\bridge\view\objects\BridgeObjectsView.ts

import { BRIDGE_EVENT, type BridgeEncounterObjectViewState } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import type BridgeScene from '../../BridgeScene';
import BridgeObjectSpriteView from './BridgeObjectSpriteView';

export default class BridgeObjectsView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly objectViews = new Map<string, BridgeObjectSpriteView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('objects').add(this.root);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_OBJECTS_SYNCED, this.syncObjects, this);

        for (const view of this.objectViews.values()) {
            view.destroy();
        }

        this.objectViews.clear();
        this.root.destroy(true);
    }

    private syncObjects(objects: BridgeEncounterObjectViewState[]): void {
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
