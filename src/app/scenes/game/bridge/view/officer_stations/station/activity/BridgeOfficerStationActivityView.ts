import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import { BRIDGE_EVENT } from '../../../../events/bridge_event';
import type BridgeEventBus from '../../../../events/BridgeEventBus';

const TASK_LABEL_Y = -70;

const TASK_PROGRESS_BAR = {
    x: -56,
    y: -51,

    width: 112,
    height: 4,

    trackColor: 0x0b1b2e,
} as const;

const TASK_CANCEL_BUTTON = {
    x: 69,
    y: -51,

    width: 18,
    height: 16,

    backgroundColor: 0x0b1b2e,
} as const;

const INPUT_PULSE_ALPHA = 0.85;

const INPUT_PULSE_DEFINITIONS = [
    {
        x: -43,
        y: -4,
        width: 12,
        delayMs: 0,
        durationMs: 75,
        repeatDelayMs: 260,
    },
    {
        x: -32,
        y: 3,
        width: 8,
        delayMs: 145,
        durationMs: 90,
        repeatDelayMs: 390,
    },
    {
        x: 40,
        y: 3,
        width: 10,
        delayMs: 70,
        durationMs: 80,
        repeatDelayMs: 310,
    },
    {
        x: 51,
        y: -4,
        width: 11,
        delayMs: 225,
        durationMs: 70,
        repeatDelayMs: 430,
    },
] as const;

const INPUT_PULSE_HEIGHT = 3;

// Runtime task presentation authored against the common 242x180 station canvas.
//
// The label and progress live inside the monitor. Short alpha pulses sit under
// the officer hands and imitate discrete presses on the touch deck.
export default class BridgeOfficerStationActivityView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly label: Phaser.GameObjects.BitmapText;

    private readonly progressTrack: Phaser.GameObjects.Rectangle;

    private readonly progressFill: Phaser.GameObjects.Rectangle;

    private readonly cancelBackground: Phaser.GameObjects.Rectangle;

    private readonly cancelLabel: Phaser.GameObjects.BitmapText;

    private readonly inputPulses: Phaser.GameObjects.Rectangle[];

    private inputPulseTweens: Phaser.Tweens.Tween[] = [];

    private activeTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.label = this.scene.add
            .bitmapText(
                0,
                TASK_LABEL_Y,
                FONT_FAMILY.VGA_8X14,
                '',
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.SECONDARY)
            .setVisible(false);

        this.progressTrack = this.scene.add
            .rectangle(
                TASK_PROGRESS_BAR.x,
                TASK_PROGRESS_BAR.y,
                TASK_PROGRESS_BAR.width,
                TASK_PROGRESS_BAR.height,
                TASK_PROGRESS_BAR.trackColor,
            )
            .setOrigin(0, 0.5)
            .setVisible(false);

        this.progressFill = this.scene.add
            .rectangle(
                TASK_PROGRESS_BAR.x,
                TASK_PROGRESS_BAR.y,
                TASK_PROGRESS_BAR.width,
                TASK_PROGRESS_BAR.height,
                FONT_COLOR.SECONDARY,
            )
            .setOrigin(0, 0.5)
            .setVisible(false);

        this.cancelBackground = this.scene.add
            .rectangle(
                TASK_CANCEL_BUTTON.x,
                TASK_CANCEL_BUTTON.y,
                TASK_CANCEL_BUTTON.width,
                TASK_CANCEL_BUTTON.height,
                TASK_CANCEL_BUTTON.backgroundColor,
            )
            .setOrigin(0.5, 0.5)
            .setStrokeStyle(
                1,
                FONT_COLOR.SECONDARY,
            )
            .setVisible(false)
            .on(
                Phaser.Input.Events.POINTER_DOWN,
                this.handleCancelPointerDown,
                this,
            );

        this.cancelLabel = this.scene.add
            .bitmapText(
                TASK_CANCEL_BUTTON.x,
                TASK_CANCEL_BUTTON.y,
                FONT_FAMILY.VGA_8X14,
                'X',
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.SECONDARY)
            .setVisible(false);

        this.inputPulses = INPUT_PULSE_DEFINITIONS.map((definition) => {
            return this.scene.add
                .rectangle(
                    definition.x,
                    definition.y,
                    definition.width,
                    INPUT_PULSE_HEIGHT,
                    FONT_COLOR.PRIMARY,
                )
                .setOrigin(0.5, 0.5)
                .setAlpha(0);
        });

        this.root.add([
            this.label,
            this.progressTrack,
            this.progressFill,
            this.cancelBackground,
            this.cancelLabel,
            ...this.inputPulses,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public show(
        taskId: string,
        label: string,
        canBeCancelledByPlayer: boolean,
    ): void {
        this.label.setText(label.toUpperCase()).setVisible(true);
        this.setProgress(null);

        this.setCancelTask(
            canBeCancelledByPlayer
                ? taskId
                : undefined,
        );

        this.startInputPulses();
    }

    public setProgress(progress: number | null): void {
        if (progress === null) {
            this.progressTrack.setVisible(false);
            this.progressFill.setVisible(false);

            return;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const fillWidth = Math.round(TASK_PROGRESS_BAR.width * clampedProgress);

        this.progressTrack.setVisible(true);

        if (fillWidth <= 0) {
            this.progressFill.setVisible(false);

            return;
        }

        this.progressFill
            .setDisplaySize(fillWidth, TASK_PROGRESS_BAR.height)
            .setVisible(true);
    }

    public clear(): void {
        this.stopInputPulses();

        this.label.setText('').setVisible(false);
        this.setProgress(null);
        this.setCancelTask(undefined);
    }

    public destroy(): void {
        this.stopInputPulses();

        this.cancelBackground.off(
            Phaser.Input.Events.POINTER_DOWN,
            this.handleCancelPointerDown,
            this,
        );

        this.root.destroy(true);
    }

    private setCancelTask(taskId: string | undefined): void {
        this.activeTaskId = taskId;

        if (!taskId) {
            this.cancelBackground
                .disableInteractive()
                .setVisible(false);

            this.cancelLabel.setVisible(false);
            return;
        }

        this.cancelBackground
            .setVisible(true)
            .setInteractive({
                useHandCursor: true,
            });

        this.cancelLabel.setVisible(true);
    }

    private handleCancelPointerDown(): void {
        if (!this.activeTaskId) {
            return;
        }

        this.eventBus.emit(
            BRIDGE_EVENT.OFFICER_TASK_CANCEL_SELECTED,
            {
                taskId: this.activeTaskId,
            },
        );
    }

    private startInputPulses(): void {
        this.stopInputPulses();

        this.inputPulseTweens = this.inputPulses.map((pulse, index) => {
            const definition = INPUT_PULSE_DEFINITIONS[index];

            return this.scene.tweens.add({
                targets: pulse,

                alpha: INPUT_PULSE_ALPHA,

                delay: definition.delayMs,
                duration: definition.durationMs,

                yoyo: true,
                repeat: -1,
                repeatDelay: definition.repeatDelayMs,
            });
        });
    }

    private stopInputPulses(): void {
        for (const tween of this.inputPulseTweens) {
            tween.stop();
        }

        this.inputPulseTweens = [];

        for (const pulse of this.inputPulses) {
            pulse.setAlpha(0);
        }
    }
}
