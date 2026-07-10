// src\app\scenes\game\bridge\view\crew\seat\BridgeSeatView.ts

import {
    OFFICER_STATION_FRAME,
    OFFICER_STATION_FRAME_MANIFEST,
} from '../../../../../../manifests/bridge/officer_station';
import type BridgeScene from '../../../BridgeScene';
import BridgeSeatLabelView from './label/BridgeSeatLabelView';
import BridgeSeatPortraitView from './portrait/BridgeSeatPortraitView';

const SCREEN_CENTER_X = 640;

export default class BridgeSeatView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly frame: Phaser.GameObjects.Image;
    private readonly portrait: BridgeSeatPortraitView;
    private readonly label: BridgeSeatLabelView;

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

        this.portrait = new BridgeSeatPortraitView(
            this.scene,
            this.root,
            this.getPortraitBottomY(),
            this.shouldFlipPortrait(position),
        );

        this.label = new BridgeSeatLabelView(this.scene, this.root, this.getLabelY(), 'EMPTY');
    }

    public destroy(): void {
        this.label.destroy();
        this.portrait.destroy();
        this.root.destroy(true);
    }

    private shouldFlipPortrait(position: Phaser.Math.Vector2): boolean {
        return position.x > SCREEN_CENTER_X;
    }

    private getPortraitBottomY(): number {
        return this.frame.height * 0.5 - 48;
    }

    private getLabelY(): number {
        return -this.frame.height * 0.5 + 27;
    }
}
