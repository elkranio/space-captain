// src/app/scenes/game/bridge/view/crew/seat/portrait/BridgeSeatPortraitView.ts

import { OFFICER_PORTRAIT_ID, type OfficerPortraitId } from '../../../../../../../../engine/defs/officer';
import { OFFICER_PORTRAIT_SPRITES } from '../../../../../../../manifests/officers/officer_portrait';
import type BridgeScene from '../../../../BridgeScene';

// Leaf-view портрета officer seat.
// Отвечает только за Phaser sprite внутри parent seat container.
export default class BridgeSeatPortraitView {
    private readonly portraitSprite: Phaser.GameObjects.Sprite;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
        portraitBottomY: number,
        flipX: boolean,
    ) {
        const silhouette = OFFICER_PORTRAIT_SPRITES[OFFICER_PORTRAIT_ID.SILHOUETTE_00];

        this.portraitSprite = this.scene.add
            .sprite(0, portraitBottomY, silhouette.atlasKey, silhouette.frameKey)
            .setOrigin(0.5, 1)
            .setFlipX(flipX);

        parent.add(this.portraitSprite);
    }

    public setPortrait(portrait: OfficerPortraitId): void {
        const asset = OFFICER_PORTRAIT_SPRITES[portrait];

        this.portraitSprite.setTexture(asset.atlasKey, asset.frameKey);
    }

    public clearPortrait(): void {
        const silhouette = OFFICER_PORTRAIT_SPRITES[OFFICER_PORTRAIT_ID.SILHOUETTE_00];

        this.portraitSprite.setTexture(silhouette.atlasKey, silhouette.frameKey);
    }

    public setFlipX(flipX: boolean): void {
        this.portraitSprite.setFlipX(flipX);
    }

    public destroy(): void {
        this.portraitSprite.destroy();
    }
}
