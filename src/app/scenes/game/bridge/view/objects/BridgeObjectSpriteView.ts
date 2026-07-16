// src/app/scenes/game/bridge/view/objects/BridgeObjectSpriteView.ts

import type BridgeScene from '../../BridgeScene';
import type { BridgeEncounterObjectPayload } from '../../events/bridge_event';
import { getBridgeViewscreenPoint } from '../bridge_viewscreen_layout';

export default class BridgeObjectSpriteView {
    // #region Fields
    private readonly root: Phaser.GameObjects.Container;
    private readonly sprite: Phaser.GameObjects.Image;
    // #endregion

    // #region Lifecycle
    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        payload: BridgeEncounterObjectPayload,
    ) {
        this.root = this.scene.add.container(0, 0);
        parent.add(this.root);

        this.sprite = this.scene.add.image(0, 0, payload.sprite.atlasKey, payload.sprite.frameKey).setOrigin(0.5, 0.5);

        this.root.add(this.sprite);

        this.update(payload);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
    // #endregion

    // #region Public API
    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public update(payload: BridgeEncounterObjectPayload): void {
        const point = getBridgeViewscreenPoint(payload.position);

        this.root.setPosition(point.x, point.y);
        this.sprite.setTexture(payload.sprite.atlasKey, payload.sprite.frameKey);
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
    // #endregion
}
