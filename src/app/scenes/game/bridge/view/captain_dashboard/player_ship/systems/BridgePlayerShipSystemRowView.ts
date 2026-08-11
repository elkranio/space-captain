import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';

export type BridgePlayerShipSystemRowLayout = {
    iconLabel: string;
    label: string;
    roleLabel: string;
};

const ROW = {
    verticalGap: 1,

    backgroundColor: 0x0e1620,
    backgroundAlpha: 0.94,

    borderColor: 0x26394c,
    borderThickness: 1,

    iconX: 6,
    iconY: 4,
    iconSize: 28,

    iconBackgroundColor: 0x152332,
    iconBorderColor: 0x45627f,

    labelX: 44,
    labelY: 10,

    roleButtonWidth: 84,
    roleButtonHeight: 28,
    roleButtonMarginRight: 6,
    roleButtonY: 4,

    roleButtonBackgroundColor:
        0x152332,
    roleButtonBorderColor:
        0x586f88,
} as const;

// Один повторяемый визуальный row player system.
//
// Пока это только layout placeholder:
// - icon footprint;
// - system label/count footprint;
// - action-role button footprint.
//
// Availability, progress и input здесь ещё не живут.
export default class BridgePlayerShipSystemRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    constructor(
        private readonly scene: BridgeScene,
        width: number,
        height: number,
        layout:
            BridgePlayerShipSystemRowLayout,
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

        const iconBackground =
            this.scene.add
                .rectangle(
                    ROW.iconX,
                    ROW.iconY,

                    ROW.iconSize,
                    ROW.iconSize,

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
                        ROW.iconSize / 2,

                    ROW.iconY +
                        ROW.iconSize / 2,

                    FONT_FAMILY.VGA_8X14,
                    layout.iconLabel,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        const systemLabel =
            this.scene.add
                .bitmapText(
                    ROW.labelX,
                    ROW.labelY,

                    FONT_FAMILY.VGA_8X14,
                    layout.label,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const roleButtonX =
            width -
            ROW.roleButtonMarginRight -
            ROW.roleButtonWidth;

        const roleButton =
            this.scene.add
                .rectangle(
                    roleButtonX,
                    ROW.roleButtonY,

                    ROW.roleButtonWidth,
                    ROW.roleButtonHeight,

                    ROW.roleButtonBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.roleButtonBorderColor,
                );

        const roleLabel =
            this.scene.add
                .bitmapText(
                    roleButtonX +
                        ROW.roleButtonWidth /
                            2,

                    ROW.roleButtonY +
                        ROW.roleButtonHeight /
                            2,

                    FONT_FAMILY.VGA_8X14,
                    layout.roleLabel,
                    FONT_SIZE.PX_16,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        this.root.add([
            background,
            iconBackground,
            iconLabel,
            systemLabel,
            roleButton,
            roleLabel,
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

    public destroy(): void {
        this.root.destroy(true);
    }
}
