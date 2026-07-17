// src/app/scenes/game/bridge/view/objects/object_sprite/BridgeObjectSpriteView.ts

import type BridgeScene from '../../../BridgeScene';
import type { BridgeEncounterObjectPayload } from '../../../events/bridge_event';
import { getBridgeViewscreenPoint } from '../../bridge_viewscreen_layout';

// Leaf-view одного encounter object на bridge viewscreen.
// Хранит Phaser image и visual state, который нужен для arrival animation.
export default class BridgeObjectSpriteView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly objectImage: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        payload: BridgeEncounterObjectPayload,
    ) {
        this.root = this.scene.add.container(0, 0);
        parent.add(this.root);

        this.objectImage = this.scene.add
            .image(0, 0, payload.sprite.atlasKey, payload.sprite.frameKey)
            .setOrigin(0.5, 0.5);

        this.root.add(this.objectImage);

        this.update(payload);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public update(payload: BridgeEncounterObjectPayload): void {
        const point = getBridgeViewscreenPoint(payload.position);

        this.root.setPosition(point.x, point.y);
        this.objectImage.setTexture(payload.sprite.atlasKey, payload.sprite.frameKey);
    }

    public prepareForArrival(): void {
        this.root.setVisible(false);
        this.root.setScale(0);
    }

    public showForArrival(): void {
        this.root.setVisible(true);
        this.root.setScale(0);
    }

    public setArrivalScale(scale: number): void {
        this.root.setScale(scale);
    }

    public showNormal(): void {
        this.root.setVisible(true);
        this.root.setScale(1);
    }
}
