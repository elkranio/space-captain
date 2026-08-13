import {
    MISSILE_SIGNATURE_INTEL_STATUS,
} from '../../../../../../../../engine/encounter/model/missile_signature_intel';
import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import {
    CAPTAIN_DASHBOARD_STYLE,
} from '../../captain_dashboard_style';
import {
    formatCaptainDashboardCountdown,
} from '../../captain_dashboard_format';
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from '../../../../events/bridge_event';

const ROW = {
    verticalGap: 1,

    timerX: 10,
    timerY: 9,

    iconX: 78,
    iconY: 4,
    iconWidth: 42,
    iconHeight: 27,

    labelX: 132,
    labelY: 9,

    buttonWidth: 92,
    buttonHeight: 27,
    buttonGap: 8,
    buttonMarginRight: 6,
    buttonY: 4,

} as const;

type MissileThreatRowCallbacks = {
    onIdentify:
        (
            command:
                BridgeOfficerCommandSelectedPayload,
        ) => void;

    onIntercept:
        (
            command:
                BridgeOfficerCommandSelectedPayload,
        ) => void;
};

// Одна fixed-geometry missile threat row.
//
// SCI и WPN slots никогда не двигаются:
// CONFIRMED threat скрывает SCI slot;
// UNKNOWN/UNCERTAIN могут предлагать повторный анализ.
// но WPN остаётся на прежнем X.
export default class BridgeCaptainMissileThreatRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly timerText:
        Phaser.GameObjects.BitmapText;

    private readonly threatLabel:
        Phaser.GameObjects.BitmapText;

    private readonly scienceButton:
        Phaser.GameObjects.Rectangle;

    private readonly scienceLabel:
        Phaser.GameObjects.BitmapText;

    private readonly weaponsButton:
        Phaser.GameObjects.Rectangle;

    private readonly weaponsLabel:
        Phaser.GameObjects.BitmapText;

    private scienceHandler?:
        () => void;

    private weaponsHandler?:
        () => void;

    constructor(
        private readonly scene:
            BridgeScene,

        width: number,
        height: number,

        private readonly callbacks:
            MissileThreatRowCallbacks,
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

                    CAPTAIN_DASHBOARD_STYLE.row.backgroundColor,
                    CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    CAPTAIN_DASHBOARD_STYLE.row.borderThickness,
                    CAPTAIN_DASHBOARD_STYLE.row.borderColor,
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

                    CAPTAIN_DASHBOARD_STYLE.row.iconBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.row.iconBorderColor,
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
                    'MSL',
                    FONT_SIZE.PX_14,
                )
                .setOrigin(
                    0.5,
                    0.5,
                )
                .setTint(
                    FONT_COLOR.SECONDARY,
                );

        this.threatLabel =
            this.scene.add
                .bitmapText(
                    ROW.labelX,
                    ROW.labelY,

                    FONT_FAMILY.VGA_8X14,
                    'UNKNOWN MISSILE',
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
            this.createButton(
                scienceX,
                'SCI',
            );

        this.scienceButton =
            science.background;

        this.scienceLabel =
            science.label;

        const weapons =
            this.createButton(
                weaponsX,
                'WPN',
            );

        this.weaponsButton =
            weapons.background;

        this.weaponsLabel =
            weapons.label;

        this.scienceButton.on(
            'pointerdown',
            this.handleSciencePointerDown,
            this,
        );

        this.weaponsButton.on(
            'pointerdown',
            this.handleWeaponsPointerDown,
            this,
        );

        this.root.add([
            background,
            this.timerText,
            iconBackground,
            iconLabel,
            this.threatLabel,
            this.scienceButton,
            this.scienceLabel,
            this.weaponsButton,
            this.weaponsLabel,
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
        missile:
            BridgeCaptainIncomingMissilePayload,
    ): void {
        this.timerText.setText(
            formatCaptainDashboardCountdown(
                missile.timeToImpactMs,
            ),
        );

        this.threatLabel.setText(
            'MISSILE ' +
                missile.designation +
                '  ' +
                missile
                    .identificationStatus
                    .toUpperCase(),
        );

        if (
            missile
                .identificationStatus ===
            MISSILE_SIGNATURE_INTEL_STATUS
                .CONFIRMED
        ) {
            this.hideScienceAction();
        } else {
            this.setScienceAction(
                missile.actions
                    .identifyThreat,
            );
        }

        const interceptCommand =
            missile.actions
                .interceptMissile;

        this.setWeaponsAction(
            Boolean(
                interceptCommand,
            ),

            interceptCommand
                ? () => {
                      this.callbacks
                          .onIntercept(
                              interceptCommand,
                          );
                  }
                : undefined,
        );
    }

    public destroy(): void {
        this.scienceButton.off(
            'pointerdown',
            this.handleSciencePointerDown,
            this,
        );

        this.weaponsButton.off(
            'pointerdown',
            this.handleWeaponsPointerDown,
            this,
        );

        this.scienceHandler =
            undefined;

        this.weaponsHandler =
            undefined;

        this.root.destroy(true);
    }

    private createButton(
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

                    CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor,
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
                    CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor,
                );

        return {
            background,
            label,
        };
    }

    private setScienceAction(
        command:
            BridgeOfficerCommandSelectedPayload |
            undefined,
    ): void {
        this.scienceButton
            .setVisible(true);

        this.scienceLabel
            .setVisible(true);

        this.scienceButton
            .disableInteractive();

        this.scienceHandler =
            undefined;

        if (!command) {
            this.scienceButton
                .setFillStyle(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                    1,
                )
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor,
                );

            this.scienceLabel
                .setTint(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor,
                );

            return;
        }

        this.scienceHandler =
            () => {
                this.callbacks
                    .onIdentify(
                        command,
                    );
            };

        this.scienceButton
            .setFillStyle(
                CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor,
                1,
            )
            .setStrokeStyle(
                1,
                CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor,
            )
            .setInteractive({
                useHandCursor: true,
            });

        this.scienceLabel
            .setTint(
                FONT_COLOR.WHITE,
            );
    }

    private hideScienceAction(): void {
        this.scienceHandler =
            undefined;

        this.scienceButton
            .disableInteractive()
            .setVisible(false);

        this.scienceLabel
            .setVisible(false);
    }

    private setWeaponsAction(
        isActive: boolean,
        handler?:
            () => void,
    ): void {
        this.weaponsButton
            .setVisible(true)
            .disableInteractive();

        this.weaponsLabel
            .setVisible(true);

        this.weaponsHandler =
            undefined;

        if (
            !isActive ||
            !handler
        ) {
            this.weaponsButton
                .setFillStyle(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                    1,
                )
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor,
                );

            this.weaponsLabel
                .setTint(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor,
                );

            return;
        }

        this.weaponsHandler =
            handler;

        this.weaponsButton
            .setFillStyle(
                CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor,
                1,
            )
            .setStrokeStyle(
                1,
                CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor,
            )
            .setInteractive({
                useHandCursor: true,
            });

        this.weaponsLabel
            .setTint(
                FONT_COLOR.WHITE,
            );
    }

    private handleSciencePointerDown(): void {
        this.scienceHandler?.();
    }

    private handleWeaponsPointerDown(): void {
        this.weaponsHandler?.();
    }
}
