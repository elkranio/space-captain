// src/app/scenes/game/bridge/view/combat/spam/popup/BridgeSpamPopupView.ts

import type { SpriteEntry } from '../../../../../../../manifests/types';
import type BridgeScene from '../../../../BridgeScene';
import { BRIDGE_SPAM_PRESENTATION } from '../bridge_spam_layout';

type BridgeSpamPopupViewOptions = {
    scene: BridgeScene;
    parent: Phaser.GameObjects.Container;

    sprite: SpriteEntry;
    position: Phaser.Math.Vector2;
};

// Один dumb popup.
// Не знает ничего про weapon/channel/Science:
// только проигрывает appear/hide и уничтожает свой Phaser object.
export default class BridgeSpamPopupView {
    private readonly image: Phaser.GameObjects.Image;

    private isHiding = false;
    private isDestroyed = false;

    constructor(
        private readonly options: BridgeSpamPopupViewOptions,
    ) {
        this.image = this.options.scene.add
            .image(
                this.options.position.x,
                this.options.position.y,

                this.options.sprite.atlasKey,
                this.options.sprite.frameKey,
            )
            .setOrigin(0.5, 0.5)
            .setScale(0);

        this.options.parent.add(this.image);
    }

    public show(): void {
        if (this.isDestroyed || this.isHiding) {
            return;
        }

        this.options.scene.tweens.add({
            targets: this.image,

            scaleX: 1,
            scaleY: 1,

            duration: BRIDGE_SPAM_PRESENTATION.appearDurationMs,
            ease: 'Back.Out',
        });
    }

    public hide(onComplete: () => void): void {
        if (this.isDestroyed) {
            onComplete();
            return;
        }

        if (this.isHiding) {
            return;
        }

        this.isHiding = true;

        this.options.scene.tweens.killTweensOf(this.image);

        this.options.scene.tweens.add({
            targets: this.image,

            scaleX: 0,
            scaleY: 0,
            alpha: 0,

            duration: BRIDGE_SPAM_PRESENTATION.hideDurationMs,
            ease: 'Back.In',

            onComplete: () => {
                this.destroy();
                onComplete();
            },
        });
    }

    public destroy(): void {
        if (this.isDestroyed) {
            return;
        }

        this.isDestroyed = true;

        this.options.scene.tweens.killTweensOf(this.image);
        this.image.destroy();
    }
}
