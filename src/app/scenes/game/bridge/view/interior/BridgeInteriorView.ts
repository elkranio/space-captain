// src\app\scenes\game\bridge\view\interior\BridgeInteriorView.ts

import { BRIDGE_INTERIOR_ID, BRIDGE_INTERIOR_SPRITES } from '../../../../../manifests/bridge/interior';
import type BridgeScene from '../../BridgeScene';

export default class BridgeInteriorView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly backgroundImage: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bridge').add(this.root);

        const background = BRIDGE_INTERIOR_SPRITES[BRIDGE_INTERIOR_ID.GENERIC];

        this.backgroundImage = this.scene.add.image(0, 0, background.atlasKey, background.frameKey).setOrigin(0, 0);

        this.root.add(this.backgroundImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
