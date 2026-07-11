// src\app\scenes\game\bridge\view\crew\seat\portrait\BridgeSeatPortraitView.ts

import { OFFICER_PORTRAIT_ID, type OfficerPortraitId } from '../../../../../../../../engine/defs/officer';
import { OFFICER_PORTRAIT_SPRITES } from '../../../../../../../manifests/officers/officer_portrait';
import type BridgeScene from '../../../../BridgeScene';

export default class BridgeSeatPortraitView {
    private readonly sprite: Phaser.GameObjects.Sprite;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        bottomY: number,
        flipX: boolean,
    ) {
        const silhouette = OFFICER_PORTRAIT_SPRITES[OFFICER_PORTRAIT_ID.SILHOUETTE_00];

        this.sprite = this.scene.add
            .sprite(0, bottomY, silhouette.atlasKey, silhouette.frameKey)
            .setOrigin(0.5, 1)
            .setFlipX(flipX);

        parent.add(this.sprite);
    }

    public setPortrait(portrait: OfficerPortraitId): void {
        const asset = OFFICER_PORTRAIT_SPRITES[portrait];

        this.sprite.setTexture(asset.atlasKey, asset.frameKey);
    }

    public setFlipX(flipX: boolean): void {
        this.sprite.setFlipX(flipX);
    }

    public destroy(): void {
        this.sprite.destroy();
    }
}
