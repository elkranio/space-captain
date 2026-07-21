// src/app/scenes/game/bridge/view/objects/BridgeObjectsView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT, type BridgeEncounterObjectPayload } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeObjectsAnimationSequencer from './animation/BridgeObjectsAnimationSequencer';
import BridgeObjectSpriteView from './object_sprite/BridgeObjectSpriteView';

// View encounter objects на bridge viewscreen.
//
// Все объекты текущей ноды могут существовать во view одновременно,
// но видимыми становятся только объекты из актуального presentation update.
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

    // Полный snapshot объектов текущей ноды.
    // Отсутствующие объекты действительно удаляются.
    private prepareObjects(objects: BridgeEncounterObjectPayload[]): void {
        this.animationSequencer.stop();

        this.syncObjectViews(objects, true);

        for (const view of this.objectViews.values()) {
            view.prepareForArrival();
        }
    }

    // Presentation update: показывает переданный набор объектов,
    // но не уничтожает остальные подготовленные object views.
    private syncObjects(objects: BridgeEncounterObjectPayload[]): void {
        this.animationSequencer.stop();

        this.syncObjectViews(objects, false);

        // Сначала скрываем все объекты ноды.
        for (const view of this.objectViews.values()) {
            view.prepareForArrival();
        }

        // Затем показываем только активный presentation subset.
        for (const object of objects) {
            const view = this.objectViews.get(object.id);

            if (!view) {
                throw new Error(`Bridge object view not found: ${object.id}`);
            }

            view.showNormal();
        }
    }

    private syncObjectViews(objects: BridgeEncounterObjectPayload[], removeMissingObjects: boolean): void {
        const receivedObjectIds = new Set<string>();

        for (const object of objects) {
            receivedObjectIds.add(object.id);

            const existingView = this.objectViews.get(object.id);

            if (existingView) {
                existingView.update(object);
                continue;
            }

            const view = new BridgeObjectSpriteView(this.scene, this.root, object);

            this.objectViews.set(object.id, view);
        }

        if (!removeMissingObjects) {
            return;
        }

        for (const [objectId, view] of this.objectViews) {
            if (receivedObjectIds.has(objectId)) {
                continue;
            }

            view.destroy();
            this.objectViews.delete(objectId);
        }
    }
}
