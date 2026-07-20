// src/app/scenes/game/bridge/view/crew/seat/activity/BridgeSeatActivityView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

const ACTIVITY_LABEL_POSITION = new Phaser.Math.Vector2(0, 84);

const ACTIVITY_LABEL_ALPHA = {
    ACTIVE: 1,
    DIM: 0.5,
} as const;

const ACTIVITY_LABEL_TWEEN_DURATION_MS = 550;

// Маленький view текущей активности officer-а.
// Это не progress bar: игрок видит, чем officer занят, но не точный процент выполнения.
export default class BridgeSeatActivityView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly label: Phaser.GameObjects.BitmapText;

    private pulseTween?: Phaser.Tweens.Tween;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(ACTIVITY_LABEL_POSITION.x, ACTIVITY_LABEL_POSITION.y);
        this.root.setVisible(false);

        this.label = this.scene.add.bitmapText(0, 0, FONT_FAMILY.VGA_8X14, '', FONT_SIZE.PX_16);

        this.label.setOrigin(0.5, 0.5);
        this.label.setTint(FONT_COLOR.ACTIVITY);

        this.root.add(this.label);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public show(text: string): void {
        this.label.setText(text.toUpperCase());

        this.root.setVisible(true);
        this.root.setAlpha(ACTIVITY_LABEL_ALPHA.ACTIVE);

        this.startPulse();
    }

    public clear(): void {
        this.stopPulse();

        this.label.setText('');
        this.root.setAlpha(ACTIVITY_LABEL_ALPHA.ACTIVE);
        this.root.setVisible(false);
    }

    public destroy(): void {
        this.stopPulse();
        this.root.destroy(true);
    }

    private startPulse(): void {
        this.stopPulse();

        this.pulseTween = this.scene.tweens.add({
            targets: this.root,
            alpha: ACTIVITY_LABEL_ALPHA.DIM,
            duration: ACTIVITY_LABEL_TWEEN_DURATION_MS,
            yoyo: true,
            repeat: -1,
        });
    }

    private stopPulse(): void {
        this.pulseTween?.stop();
        this.pulseTween = undefined;
    }
}
