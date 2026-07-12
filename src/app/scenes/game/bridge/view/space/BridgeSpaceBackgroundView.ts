// src\app\scenes\game\bridge\view\space\BridgeSpaceBackgroundView.ts

import { SPACE_BACKGROUND_ID, type SpaceBackgroundId } from '../../../../../../engine/defs/space_background';
import { SPACE_BACKGROUND_SPRITES } from '../../../../../manifests/bridge/space_background';
import type BridgeScene from '../../BridgeScene';

const SPACE_BACKGROUND_X = 220;
const SPACE_BACKGROUND_Y = 115;

export default class BridgeSpaceBackgroundView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly background: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('space').add(this.root);

        const asset = SPACE_BACKGROUND_SPRITES[SPACE_BACKGROUND_ID.NEBULA_00];

        this.background = this.scene.add
            .image(SPACE_BACKGROUND_X, SPACE_BACKGROUND_Y, asset.atlasKey, asset.frameKey)
            .setOrigin(0, 0);

        this.root.add(this.background);
    }

    public setBackground(backgroundId: SpaceBackgroundId): void {
        const asset = SPACE_BACKGROUND_SPRITES[backgroundId];

        this.background.setTexture(asset.atlasKey, asset.frameKey);
    }

    public destroy(): void {
        this.root.destroy(true);
    }
}
