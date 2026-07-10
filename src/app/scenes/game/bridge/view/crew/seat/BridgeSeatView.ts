// src\app\scenes\game\bridge\view\crew\seat\BridgeSeatView.ts

import {
    OFFICER_STATION_FRAME,
    OFFICER_STATION_FRAME_MANIFEST,
} from '../../../../../../manifests/bridge/officer_station';
import type BridgeScene from '../../../BridgeScene';

const FONT_KEY = 'pixel_operator' as const;

export default class BridgeSeatView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly frame: Phaser.GameObjects.Image;
    private readonly label: Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        position: Phaser.Math.Vector2,
    ) {
        this.root = this.scene.add.container(position.x, position.y);
        parent.add(this.root);

        const frameAsset = OFFICER_STATION_FRAME_MANIFEST[OFFICER_STATION_FRAME.EMPTY];

        this.frame = this.scene.add.image(0, 0, frameAsset.atlasKey, frameAsset.frameKey).setOrigin(0.5, 0.5);

        this.root.add(this.frame);

        this.label = this.scene.add
            .bitmapText(0, this.getLabelY(), FONT_KEY, 'EMPTY', 18)
            .setOrigin(0.5, 0.5)
            .setTint(0xd7e6ff);

        this.root.add(this.label);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private getLabelY(): number {
        return -this.frame.height * 0.5 + 27;
    }
}
