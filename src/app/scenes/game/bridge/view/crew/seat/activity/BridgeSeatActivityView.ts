// src/app/scenes/game/bridge/view/crew/seat/activity/BridgeSeatActivityView.ts

import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

const ACTIVITY_POSITION = new Phaser.Math.Vector2(0, 84);

const ACTIVITY_LABEL_ALPHA = {
    ACTIVE: 1,
    DIM: 0.5,
} as const;

const ACTIVITY_LABEL_TWEEN_DURATION_MS = 550;

const ACTIVITY_PROGRESS_BAR = {
    y: 13,

    width: 112,
    height: 4,

    trackColor: 0x17131f,
} as const;

// Маленький view текущей активности officer-а.
//
// Label показывает, чем officer занят.
//
// Progress bar показывается только для tasks,
// которые engine пометил showProgress=true.
export default class BridgeSeatActivityView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly label: Phaser.GameObjects.BitmapText;

    private readonly progressTrack: Phaser.GameObjects.Rectangle;

    private readonly progressFill: Phaser.GameObjects.Rectangle;

    private pulseTween?: Phaser.Tweens.Tween;

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(ACTIVITY_POSITION.x, ACTIVITY_POSITION.y);

        this.root.setVisible(false);

        this.progressTrack = this.scene.add.rectangle(
            0,
            ACTIVITY_PROGRESS_BAR.y,

            ACTIVITY_PROGRESS_BAR.width,
            ACTIVITY_PROGRESS_BAR.height,

            ACTIVITY_PROGRESS_BAR.trackColor,
        );

        this.progressTrack.setVisible(false);

        this.progressFill = this.scene.add.rectangle(
            -ACTIVITY_PROGRESS_BAR.width / 2,

            ACTIVITY_PROGRESS_BAR.y,

            ACTIVITY_PROGRESS_BAR.width,
            ACTIVITY_PROGRESS_BAR.height,

            FONT_COLOR.ACTIVITY,
        );

        this.progressFill.setOrigin(0, 0.5).setVisible(false);

        this.label = this.scene.add.bitmapText(
            0,
            0,

            FONT_FAMILY.VGA_8X14,
            '',
            FONT_SIZE.PX_16,
        );

        this.label.setOrigin(0.5, 0.5);
        this.label.setTint(FONT_COLOR.ACTIVITY);

        this.root.add([this.progressTrack, this.progressFill, this.label]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public show(text: string): void {
        this.label.setText(text.toUpperCase());

        this.root.setVisible(true);

        this.startPulse();
    }

    public setProgress(progress: number | null): void {
        if (progress === null) {
            this.progressTrack.setVisible(false);
            this.progressFill.setVisible(false);

            return;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);

        const fillWidth = Math.round(ACTIVITY_PROGRESS_BAR.width * clampedProgress);

        this.progressTrack.setVisible(true);

        if (fillWidth <= 0) {
            this.progressFill.setVisible(false);

            return;
        }

        this.progressFill.setVisible(true).setDisplaySize(fillWidth, ACTIVITY_PROGRESS_BAR.height);
    }

    public clear(): void {
        this.stopPulse();

        this.label.setText('');

        this.setProgress(null);

        this.root.setVisible(false);
    }

    public destroy(): void {
        this.stopPulse();

        this.root.destroy(true);
    }

    private startPulse(): void {
        this.stopPulse();

        // Мигает только task label.
        // Progress bar остаётся стабильным,
        // чтобы игрок мог читать тайминг.
        this.pulseTween = this.scene.tweens.add({
            targets: this.label,

            alpha: ACTIVITY_LABEL_ALPHA.DIM,

            duration: ACTIVITY_LABEL_TWEEN_DURATION_MS,

            yoyo: true,
            repeat: -1,
        });
    }

    private stopPulse(): void {
        this.pulseTween?.stop();
        this.pulseTween = undefined;

        this.label.setAlpha(ACTIVITY_LABEL_ALPHA.ACTIVE);
    }
}
