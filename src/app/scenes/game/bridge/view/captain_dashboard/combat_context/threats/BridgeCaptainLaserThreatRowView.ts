import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import type {
    BridgeCaptainIncomingLaserPayload,
} from '../../../../events/bridge_event';

const ROW = {
    verticalGap: 1,

    backgroundColor: 0x0e1620,
    backgroundAlpha: 0.94,

    borderColor: 0x26394c,
    borderThickness: 1,

    timerX: 10,
    timerY: 9,

    iconX: 78,
    iconY: 4,
    iconWidth: 42,
    iconHeight: 27,

    iconBackgroundColor: 0x152332,
    iconBorderColor: 0x45627f,

    labelX: 132,
    labelY: 9,

    buttonWidth: 92,
    buttonHeight: 27,
    buttonGap: 8,
    buttonMarginRight: 6,
    buttonY: 4,

    disabledBackgroundColor: 0x101923,
    disabledBorderColor: 0x26394c,
    disabledTextColor: 0x536778,
} as const;

// Первый captain-dashboard laser row.
//
// Пока только отображает threat + countdown.
// SCI/WPN slots намеренно disabled:
// реальную response-команду добавим после отдельного shield design atom.
export default class BridgeCaptainLaserThreatRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly timerText:
        Phaser.GameObjects.BitmapText;

    constructor(
        private readonly scene:
            BridgeScene,

        width: number,
        height: number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        const visibleHeight =
            Math.max(
                1,
                height -
                    ROW.verticalGap,
            );

        const background =
            this.scene.add
                .rectangle(
                    0,
                    0,

                    width,
                    visibleHeight,

                    ROW.backgroundColor,
                    ROW.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    ROW.borderThickness,
                    ROW.borderColor,
                );

        this.timerText =
            this.scene.add
                .bitmapText(
                    ROW.timerX,
                    ROW.timerY,

                    FONT_FAMILY.VGA_8X14,
                    '--.-s',
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.ACTIVITY,
                );

        const iconBackground =
            this.scene.add
                .rectangle(
                    ROW.iconX,
                    ROW.iconY,

                    ROW.iconWidth,
                    ROW.iconHeight,

                    ROW.iconBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.iconBorderColor,
                );

        const iconLabel =
            this.scene.add
                .bitmapText(
                    ROW.iconX +
                        ROW.iconWidth /
                            2,

                    ROW.iconY +
                        ROW.iconHeight /
                            2,

                    FONT_FAMILY.VGA_8X14,
                    'LSR',
                    FONT_SIZE.PX_14,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        const threatLabel =
            this.scene.add
                .bitmapText(
                    ROW.labelX,
                    ROW.labelY,

                    FONT_FAMILY.VGA_8X14,
                    'LASER ATTACK',
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const weaponsX =
            width -
            ROW.buttonMarginRight -
            ROW.buttonWidth;

        const scienceX =
            weaponsX -
            ROW.buttonGap -
            ROW.buttonWidth;

        const science =
            this.createDisabledButton(
                scienceX,
                'SCI',
            );

        const weapons =
            this.createDisabledButton(
                weaponsX,
                'WPN',
            );

        this.root.add([
            background,
            this.timerText,
            iconBackground,
            iconLabel,
            threatLabel,
            science.background,
            science.label,
            weapons.background,
            weapons.label,
        ]);
    }

    public getRoot():
        Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(
        x: number,
        y: number,
    ): void {
        this.root.setPosition(
            x,
            y,
        );
    }

    public update(
        laser:
            BridgeCaptainIncomingLaserPayload,
    ): void {
        this.timerText.setText(
            formatTimer(
                laser.timeToFireMs,
            ),
        );
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private createDisabledButton(
        x: number,
        labelText: string,
    ): {
        background:
            Phaser.GameObjects.Rectangle;

        label:
            Phaser.GameObjects.BitmapText;
    } {
        const background =
            this.scene.add
                .rectangle(
                    x,
                    ROW.buttonY,

                    ROW.buttonWidth,
                    ROW.buttonHeight,

                    ROW.disabledBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.disabledBorderColor,
                );

        const label =
            this.scene.add
                .bitmapText(
                    x +
                        ROW.buttonWidth /
                            2,

                    ROW.buttonY +
                        ROW.buttonHeight /
                            2,

                    FONT_FAMILY.VGA_8X14,
                    labelText,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    ROW.disabledTextColor,
                );

        return {
            background,
            label,
        };
    }
}

function formatTimer(
    timeToFireMs: number,
): string {
    return (
        Math.max(
            0,
            timeToFireMs,
        ) /
        1000
    ).toFixed(1) + 's';
}
