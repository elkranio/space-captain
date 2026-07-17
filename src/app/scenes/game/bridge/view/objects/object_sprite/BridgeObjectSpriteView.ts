// src/app/scenes/game/bridge/view/objects/object_sprite/BridgeObjectSpriteView.ts

import type BridgeScene from '../../../BridgeScene';
import type { BridgeEncounterObjectPayload } from '../../../events/bridge_event';
import { getBridgeViewscreenPoint } from '../../bridge_viewscreen_layout';

// Leaf-view одного encounter object на bridge viewscreen.
// Хранит Phaser image и отдаёт наружу только безопасный API для object-level animation sequences.
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

    public update(payload: BridgeEncounterObjectPayload): void {
        const point = getBridgeViewscreenPoint(payload.position);

        this.setPosition(point.x, point.y);
        this.objectImage.setTexture(payload.sprite.atlasKey, payload.sprite.frameKey);
    }

    public prepareForArrival(): void {
        this.root.setVisible(false);
        this.setScale(0);
    }

    public showForArrival(): void {
        this.root.setVisible(true);
        this.setScale(0);
    }

    public setArrivalScale(scale: number): void {
        this.setScale(scale);
    }

    public showNormal(): void {
        this.root.setVisible(true);
        this.setScale(1);
    }

    public getX(): number {
        return this.root.x;
    }

    public getY(): number {
        return this.root.y;
    }

    public getScale(): number {
        return this.root.scaleX;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setScale(scale: number): void {
        this.root.setScale(scale);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
