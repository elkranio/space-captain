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
    BridgeCaptainIncomingBeamCannonPayload,
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

type BeamCannonThreatRowCallbacks = {
    onDeployShield:
        (
            command:
                import('../../../../events/bridge_event')
                    .BridgeOfficerCommandSelectedPayload,
        ) => void;
};

// Первый captain-dashboard beamCannon row.
//
// SCI slot пока намеренно disabled:
// beamCannon ещё не нацелен на конкретные ship nodes.
// Второй action slot принадлежит ENG и поднимает shield
// через обычный resolved officer-command flow.
export default class BridgeCaptainBeamCannonThreatRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly timerText:
        Phaser.GameObjects.BitmapText;

    private readonly engineerButton:
        Phaser.GameObjects.Rectangle;

    private readonly engineerLabel:
        Phaser.GameObjects.BitmapText;

    private engineerHandler?:
        () => void;

    constructor(
        private readonly scene:
            BridgeScene,

        width: number,
        height: number,

        private readonly callbacks:
            BeamCannonThreatRowCallbacks,
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
                    'BEAM_CANNON ATTACK',
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const engineerX =
            width -
            ROW.buttonMarginRight -
            ROW.buttonWidth;

        const scienceX =
            engineerX -
            ROW.buttonGap -
            ROW.buttonWidth;

        const science =
            this.createDisabledButton(
                scienceX,
                'SCI',
            );

        const engineer =
            this.createDisabledButton(
                engineerX,
                'ENG',
            );

        this.engineerButton =
            engineer.background;

        this.engineerLabel =
            engineer.label;

        this.engineerButton.on(
            'pointerdown',
            this.handleEngineerPointerDown,
            this,
        );

        this.root.add([
            background,
            this.timerText,
            iconBackground,
            iconLabel,
            threatLabel,
            science.background,
            science.label,
            this.engineerButton,
            this.engineerLabel,
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
        beamCannon:
            BridgeCaptainIncomingBeamCannonPayload,
    ): void {
        this.timerText.setText(
            formatCaptainDashboardCountdown(
                beamCannon.timeToFireMs,
            ),
        );

        this.setEngineerAction(
            beamCannon.actions
                .deployShield,
        );
    }

    public destroy(): void {
        this.engineerButton.off(
            'pointerdown',
            this.handleEngineerPointerDown,
            this,
        );

        this.engineerHandler =
            undefined;

        this.root.destroy(true);
    }


    private setEngineerAction(
        command:
            import('../../../../events/bridge_event')
                .BridgeOfficerCommandSelectedPayload |
            undefined,
    ): void {
        this.engineerButton
            .disableInteractive();

        this.engineerHandler =
            undefined;

        if (!command) {
            this.engineerButton
                .setFillStyle(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                    1,
                )
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor,
                );

            this.engineerLabel
                .setTint(
                    CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor,
                );

            return;
        }

        this.engineerHandler =
            () => {
                this.callbacks
                    .onDeployShield(
                        command,
                    );
            };

        this.engineerButton
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

        this.engineerLabel
            .setTint(
                FONT_COLOR.WHITE,
            );
    }

    private handleEngineerPointerDown(): void {
        this.engineerHandler?.();
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
}
