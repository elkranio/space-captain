// src/app/scenes/game/bridge/view/space/BridgeSpaceBackgroundView.ts

import { SPACE_BACKGROUND_ID, type SpaceBackgroundId } from '../../../../../../engine/defs/space_background';
import { SPACE_BACKGROUND_SPRITES } from '../../../../../manifests/bridge/space_background';
import type BridgeScene from '../../BridgeScene';
import { BRIDGE_VIEWSCREEN_RECT } from '../bridge_viewscreen_layout';

// View фонового изображения за bridge viewscreen.
// Отвечает только за Phaser image в space layer и смену background texture.
export default class BridgeSpaceBackgroundView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly background: Phaser.GameObjects.Image;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('space').add(this.root);

        const asset = SPACE_BACKGROUND_SPRITES[SPACE_BACKGROUND_ID.NEBULA_00];

        this.background = this.scene.add
            .image(BRIDGE_VIEWSCREEN_RECT.x, BRIDGE_VIEWSCREEN_RECT.y, asset.atlasKey, asset.frameKey)
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
