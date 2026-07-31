// src/app/scenes/game/bridge/view/vfx/drive_disruption/BridgeDriveDisruptionView.ts

import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_VIEWSCREEN_RECT } from '../../bridge_viewscreen_layout';

const DRIVE_DISRUPTION = {
    flashColor: 0xd9c2ff,
    flashAlpha: 0.82,

    flashDurationMs: 45,
    flashRepeatDelayMs: 35,

    bandColor: 0xf5eeff,
    bandAlpha: 0.95,
    bandHeight: 10,
    bandDurationMs: 260,
} as const;

// Владеет полным visual lifecycle drive disruption:
// создаёт flash/band, запускает tweens и очищает их.
export default class BridgeDriveDisruptionView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly flash:
        Phaser.GameObjects.Rectangle;

    private readonly band:
        Phaser.GameObjects.Rectangle;

    private flashTween?: Phaser.Tweens.Tween;
    private bandTween?: Phaser.Tweens.Tween;

    constructor(
        private readonly scene: BridgeScene,
        parent: Phaser.GameObjects.Container,
    ) {
        this.root = this.scene.add.container(0, 0);
        parent.add(this.root);

        this.flash = this.scene.add
            .rectangle(
                0,
                0,
                this.scene.scale.width,
                this.scene.scale.height,
                DRIVE_DISRUPTION.flashColor,
                1,
            )
            .setOrigin(0, 0)
            .setAlpha(0)
            .setVisible(false)
            .setBlendMode(
                Phaser.BlendModes.ADD,
            );

        this.band = this.scene.add
            .rectangle(
                BRIDGE_VIEWSCREEN_RECT.x,
                BRIDGE_VIEWSCREEN_RECT.y,

                BRIDGE_VIEWSCREEN_RECT.width,
                DRIVE_DISRUPTION.bandHeight,

                DRIVE_DISRUPTION.bandColor,
                1,
            )
            .setOrigin(0, 0)
            .setAlpha(0)
            .setVisible(false)
            .setBlendMode(
                Phaser.BlendModes.ADD,
            );

        this.root.add([
            this.flash,
            this.band,
        ]);
    }

    public play(): void {
        this.stopTweens();

        this.flash
            .setVisible(true)
            .setAlpha(0);

        this.band
            .setVisible(true)
            .setPosition(
                BRIDGE_VIEWSCREEN_RECT.x,
                BRIDGE_VIEWSCREEN_RECT.y,
            )
            .setAlpha(
                DRIVE_DISRUPTION.bandAlpha,
            );

        this.flashTween =
            this.scene.tweens.add({
                targets: this.flash,

                alpha:
                    DRIVE_DISRUPTION.flashAlpha,

                duration:
                    DRIVE_DISRUPTION
                        .flashDurationMs,

                ease: 'Linear',
                yoyo: true,

                repeat: 1,
                repeatDelay:
                    DRIVE_DISRUPTION
                        .flashRepeatDelayMs,

                onComplete: () => {
                    this.flashTween = undefined;

                    this.flash
                        .setVisible(false)
                        .setAlpha(0);
                },
            });

        this.bandTween =
            this.scene.tweens.add({
                targets: this.band,

                y:
                    BRIDGE_VIEWSCREEN_RECT.y +
                    BRIDGE_VIEWSCREEN_RECT.height -
                    DRIVE_DISRUPTION.bandHeight,

                alpha: 0,

                duration:
                    DRIVE_DISRUPTION
                        .bandDurationMs,

                ease: 'Linear',

                onComplete: () => {
                    this.bandTween = undefined;

                    this.band
                        .setVisible(false)
                        .setAlpha(0);
                },
            });
    }

    public destroy(): void {
        this.stopTweens();
        this.root.destroy(true);
    }

    private stopTweens(): void {
        this.flashTween?.stop();
        this.flashTween = undefined;

        this.bandTween?.stop();
        this.bandTween = undefined;

        this.scene.tweens.killTweensOf(
            this.flash,
        );

        this.scene.tweens.killTweensOf(
            this.band,
        );
    }
}
