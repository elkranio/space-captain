// src\app\scenes\game\bridge\view\interior\BridgeInteriorView.ts

import { BRIDGE_BACKGROUND_ID, BRIDGE_BACKGROUND_SPRITES } from '../../../../../manifests/bridge/background';
import type BridgeScene from '../../BridgeScene';

export default class BridgeInteriorView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly backgroundImage: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bg').add(this.root);

        const background = BRIDGE_BACKGROUND_SPRITES[BRIDGE_BACKGROUND_ID.SPACE_GENERIC];

        this.backgroundImage = this.scene.add.image(0, 0, background.atlasKey, background.frameKey).setOrigin(0, 0);

        this.root.add(this.backgroundImage);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
