// src\app\scenes\game\bridge\view\objects\BridgeObjectSpriteView.ts

import type { BridgeEncounterObjectViewState } from '../../events/bridge_event';
import type BridgeScene from '../../BridgeScene';
import { getBridgeViewscreenPoint } from '../bridge_viewscreen_layout';

export default class BridgeObjectSpriteView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly sprite: Phaser.GameObjects.Image;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        state: BridgeEncounterObjectViewState,
    ) {
        this.root = this.scene.add.container(0, 0);
        parent.add(this.root);

        this.sprite = this.scene.add.image(0, 0, state.sprite.atlasKey, state.sprite.frameKey).setOrigin(0.5, 0.5);

        this.root.add(this.sprite);

        this.update(state);
    }

    public update(state: BridgeEncounterObjectViewState): void {
        const point = getBridgeViewscreenPoint(state.position);
        this.root.setPosition(point.x, point.y);
        this.sprite.setTexture(state.sprite.atlasKey, state.sprite.frameKey);
    }

    public destroy(): void {
        this.root.destroy(true);
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
