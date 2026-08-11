import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_PLAYER_SYSTEM_ACTION_STATE,
    type BridgePlayerSystemActionState,
} from '../../../../events/bridge_event';

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

    progressHeight: 3,
    progressBackgroundColor: 0x252a2f,
    progressColor: FONT_COLOR.ACTIVITY,

    labelX: 44,
    labelY: 10,

    roleButtonWidth: 84,
    roleButtonHeight: 28,
    roleButtonMarginRight: 6,
    roleButtonY: 4,

    actionActiveBackgroundColor:
        0x193147,
    actionActiveBorderColor:
        0x7aa0c4,

    actionDisabledBackgroundColor:
        0x101923,
    actionDisabledBorderColor:
        0x26394c,
    actionDisabledTextColor:
        0x536778,

    actionBusyBackgroundColor:
        0x171a1f,
    actionBusyBorderColor:
        0x8a6a35,

    actionEngagedBackgroundColor:
        0x2a2115,
    actionEngagedBorderColor:
        FONT_COLOR.ACTIVITY,
} as const;

// Один повторяемый визуальный row player system.
//
// Не знает domain-семантику конкретного оружия.
// Получает уже готовые:
// - label;
// - progress 0..1;
// - presentation state action button;
// - callback только для ACTIVE action.
export default class BridgePlayerShipSystemRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly systemLabel:
        Phaser.GameObjects.BitmapText;

    private readonly progressBackground:
        Phaser.GameObjects.Rectangle;

    private readonly progressFill:
        Phaser.GameObjects.Rectangle;

    private readonly roleButton:
        Phaser.GameObjects.Rectangle;

    private readonly roleLabel:
        Phaser.GameObjects.BitmapText;

    private actionHandler?:
        () => void;

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

        const progressY =
            ROW.iconY +
            ROW.iconSize;

        this.progressBackground =
            this.scene.add
                .rectangle(
                    ROW.iconX,
                    progressY,

                    ROW.iconSize,
                    ROW.progressHeight,

                    ROW.progressBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.progressFill =
            this.scene.add
                .rectangle(
                    ROW.iconX,
                    progressY,

                    ROW.iconSize,
                    ROW.progressHeight,

                    ROW.progressColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

        this.systemLabel =
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

        this.roleButton =
            this.scene.add
                .rectangle(
                    roleButtonX,
                    ROW.roleButtonY,

                    ROW.roleButtonWidth,
                    ROW.roleButtonHeight,

                    ROW.actionDisabledBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    ROW.actionDisabledBorderColor,
                );

        this.roleLabel =
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
                );

        this.roleButton.on(
            'pointerdown',
            this.handleActionPointerDown,
            this,
        );

        this.root.add([
            background,
            iconBackground,
            iconLabel,
            this.progressBackground,
            this.progressFill,
            this.systemLabel,
            this.roleButton,
            this.roleLabel,
        ]);

        this.setAction(
            BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .DISABLED_SYSTEM,
        );
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

    public setSystemLabel(
        text: string,
    ): void {
        this.systemLabel.setText(
            text,
        );
    }

    public setProgress(
        progress:
            number | undefined,
    ): void {
        if (
            progress ===
            undefined
        ) {
            this.progressBackground
                .setVisible(false);

            this.progressFill
                .setVisible(false);

            return;
        }

        const clampedProgress =
            Math.max(
                0,
                Math.min(
                    1,
                    progress,
                ),
            );

        this.progressBackground
            .setVisible(true);

        this.progressFill
            .setVisible(true)
            .setScale(
                clampedProgress,
                1,
            );
    }

    public setAction(
        state:
            BridgePlayerSystemActionState,
        onSelected?:
            () => void,
    ): void {
        if (
            state ===
                BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                    .ACTIVE &&
            !onSelected
        ) {
            throw new Error(
                'Active player system action requires click handler',
            );
        }

        this.actionHandler =
            state ===
            BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .ACTIVE
                ? onSelected
                : undefined;

        this.applyActionVisualState(
            state,
        );
    }

    public destroy(): void {
        this.roleButton.off(
            'pointerdown',
            this.handleActionPointerDown,
            this,
        );

        this.actionHandler = undefined;

        this.root.destroy(true);
    }

    private handleActionPointerDown(): void {
        this.actionHandler?.();
    }

    private applyActionVisualState(
        state:
            BridgePlayerSystemActionState,
    ): void {
        this.roleButton
            .disableInteractive();

        switch (state) {
            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .ACTIVE:
                this.roleButton
                    .setFillStyle(
                        ROW.actionActiveBackgroundColor,
                        1,
                    )
                    .setStrokeStyle(
                        1,
                        ROW.actionActiveBorderColor,
                    )
                    .setInteractive({
                        useHandCursor: true,
                    });

                this.roleLabel
                    .setTint(
                        FONT_COLOR.WHITE,
                    );

                return;

            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .DISABLED_SYSTEM:
                this.roleButton
                    .setFillStyle(
                        ROW.actionDisabledBackgroundColor,
                        1,
                    )
                    .setStrokeStyle(
                        1,
                        ROW.actionDisabledBorderColor,
                    );

                this.roleLabel
                    .setTint(
                        ROW.actionDisabledTextColor,
                    );

                return;

            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .DISABLED_OFFICER_BUSY:
                this.roleButton
                    .setFillStyle(
                        ROW.actionBusyBackgroundColor,
                        1,
                    )
                    .setStrokeStyle(
                        1,
                        ROW.actionBusyBorderColor,
                    );

                this.roleLabel
                    .setTint(
                        ROW.actionBusyBorderColor,
                    );

                return;

            case BRIDGE_PLAYER_SYSTEM_ACTION_STATE
                .ENGAGED_CURRENT_WORK:
                this.roleButton
                    .setFillStyle(
                        ROW.actionEngagedBackgroundColor,
                        1,
                    )
                    .setStrokeStyle(
                        1,
                        ROW.actionEngagedBorderColor,
                    );

                this.roleLabel
                    .setTint(
                        FONT_COLOR.ACTIVITY,
                    );

                return;

            default: {
                const exhaustiveState:
                    never =
                    state;

                return exhaustiveState;
            }
        }
    }
}
