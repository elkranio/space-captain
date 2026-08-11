import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgeCaptainIncomingMissilePayload,
    type BridgeOfficerCommandSelectedPayload,
} from '../../../../events/bridge_event';
import type BridgeEventBus from '../../../../events/BridgeEventBus';
import BridgeCaptainMissileThreatRowView from './BridgeCaptainMissileThreatRowView';

const ROW_HEIGHT = 36;

const SELECTOR = {
    backgroundColor: 0x0e1620,
    backgroundAlpha: 0.98,

    borderColor: 0x31465b,

    contextX: 14,
    contextY: 14,

    buttonWidth: 150,
    buttonHeight: 42,
    buttonGap: 16,

    buttonY: 62,

    closeSize: 34,
    closeMargin: 8,

    disabledBackgroundColor: 0x101923,
    disabledBorderColor: 0x26394c,
    disabledTextColor: 0x536778,

    redBackgroundColor: 0x321a1a,
    redBorderColor: 0xc96559,

    blueBackgroundColor: 0x172a38,
    blueBorderColor: 0x5c9bc5,
} as const;

type BeamSelectorButton = {
    background:
        Phaser.GameObjects.Rectangle;

    label:
        Phaser.GameObjects.BitmapText;

    handler?:
        () => void;
};

// Missile threat list + inline point-defense beam selector.
//
// Selector заменяет содержимое threat-area,
// поэтому это не popup и не отдельное overlay window.
export default class BridgeCaptainMissileThreatsView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly listRoot:
        Phaser.GameObjects.Container;

    private readonly selectorRoot:
        Phaser.GameObjects.Container;

    private readonly selectorContextText:
        Phaser.GameObjects.BitmapText;

    private readonly redButton:
        BeamSelectorButton;

    private readonly blueButton:
        BeamSelectorButton;

    private readonly closeButton:
        BeamSelectorButton;

    private readonly rowViews:
        BridgeCaptainMissileThreatRowView[] =
            [];

    private missiles:
        BridgeCaptainIncomingMissilePayload[] =
            [];

    private selectedMissileId?:
        string;

    constructor(
        private readonly scene:
            BridgeScene,

        private readonly eventBus:
            BridgeEventBus,

        private readonly width:
            number,

        private readonly height:
            number,
    ) {
        this.root =
            this.scene.add.container(
                0,
                0,
            );

        this.listRoot =
            this.scene.add.container(
                0,
                0,
            );

        this.selectorRoot =
            this.scene.add
                .container(
                    0,
                    0,
                )
                .setVisible(false);

        const selectorBackground =
            this.scene.add
                .rectangle(
                    0,
                    0,

                    this.width,
                    this.height,

                    SELECTOR
                        .backgroundColor,

                    SELECTOR
                        .backgroundAlpha,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    SELECTOR
                        .borderColor,
                );

        this.selectorContextText =
            this.scene.add
                .bitmapText(
                    SELECTOR.contextX,
                    SELECTOR.contextY,

                    FONT_FAMILY.VGA_8X14,
                    '--.-s  UNKNOWN MISSILE',
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const totalBeamWidth =
            SELECTOR.buttonWidth *
                2 +
            SELECTOR.buttonGap;

        const firstBeamX =
            (this.width -
                totalBeamWidth) /
            2;

        this.redButton =
            this.createSelectorButton(
                firstBeamX,
                SELECTOR.buttonY,
                SELECTOR.buttonWidth,
                SELECTOR.buttonHeight,
                'RED',
            );

        this.blueButton =
            this.createSelectorButton(
                firstBeamX +
                    SELECTOR.buttonWidth +
                    SELECTOR.buttonGap,

                SELECTOR.buttonY,

                SELECTOR.buttonWidth,
                SELECTOR.buttonHeight,
                'BLUE',
            );

        this.closeButton =
            this.createSelectorButton(
                this.width -
                    SELECTOR.closeMargin -
                    SELECTOR.closeSize,

                SELECTOR.closeMargin,

                SELECTOR.closeSize,
                SELECTOR.closeSize,
                'X',
            );

        this.closeButton.handler =
            () => {
                this.closeBeamSelector();
            };

        this.applySelectorButtonState(
            this.closeButton,
            true,
            FONT_COLOR.SECONDARY,
            0x152332,
        );

        this.selectorRoot.add([
            selectorBackground,
            this.selectorContextText,
            this.redButton.background,
            this.redButton.label,
            this.blueButton.background,
            this.blueButton.label,
            this.closeButton.background,
            this.closeButton.label,
        ]);

        this.root.add([
            this.listRoot,
            this.selectorRoot,
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
        missiles:
            BridgeCaptainIncomingMissilePayload[],
    ): void {
        this.missiles =
            missiles;

        this.reconcileRows();
        this.reconcileBeamSelector();
    }

    public destroy(): void {
        this.clearRows();

        this.destroySelectorButton(
            this.redButton,
        );

        this.destroySelectorButton(
            this.blueButton,
        );

        this.destroySelectorButton(
            this.closeButton,
        );

        this.selectorRoot
            .destroy(true);

        this.listRoot
            .destroy(false);

        this.root
            .destroy(false);
    }

    private reconcileRows(): void {
        while (
            this.rowViews.length >
            this.missiles.length
        ) {
            const rowView =
                this.rowViews.pop();

            rowView?.destroy();
        }

        while (
            this.rowViews.length <
            this.missiles.length
        ) {
            const rowView =
                new BridgeCaptainMissileThreatRowView(
                    this.scene,
                    this.width,
                    ROW_HEIGHT,

                    {
                        onIdentify:
                            (command) => {
                                this.emitCommand(
                                    command,
                                );
                            },

                        onDestroyUnknown:
                            (missile) => {
                                this.openBeamSelector(
                                    missile,
                                );
                            },

                        onDestroyIdentified:
                            (command) => {
                                this.emitCommand(
                                    command,
                                );
                            },
                    },
                );

            this.rowViews.push(
                rowView,
            );

            this.listRoot.add(
                rowView.getRoot(),
            );
        }

        for (
            let index = 0;
            index <
            this.missiles.length;
            index += 1
        ) {
            const missile =
                this.missiles[index];

            const rowView =
                this.rowViews[index];

            if (
                !missile ||
                !rowView
            ) {
                continue;
            }

            rowView.setPosition(
                0,
                index *
                    ROW_HEIGHT,
            );

            rowView.update(
                missile,
            );
        }
    }

    private reconcileBeamSelector(): void {
        if (!this.selectedMissileId) {
            return;
        }

        const missile =
            this.missiles.find(
                (candidate) => {
                    return (
                        candidate.projectileId ===
                        this.selectedMissileId
                    );
                },
            );

        // Threat resolved/removed while selector was open.
        if (!missile) {
            this.closeBeamSelector();
            return;
        }

        // Science may identify it while selector is open.
        // Return to normal row; next WPN click will use
        // the resolved beam immediately.
        if (missile.spectralBand) {
            this.closeBeamSelector();
            return;
        }

        this.updateBeamSelector(
            missile,
        );
    }

    private openBeamSelector(
        missile:
            BridgeCaptainIncomingMissilePayload,
    ): void {
        this.selectedMissileId =
            missile.projectileId;

        this.listRoot
            .setVisible(false);

        this.selectorRoot
            .setVisible(true);

        this.updateBeamSelector(
            missile,
        );
    }

    private closeBeamSelector(): void {
        this.selectedMissileId =
            undefined;

        this.selectorRoot
            .setVisible(false);

        this.listRoot
            .setVisible(true);

        this.redButton.handler =
            undefined;

        this.blueButton.handler =
            undefined;
    }

    private updateBeamSelector(
        missile:
            BridgeCaptainIncomingMissilePayload,
    ): void {
        this.selectorContextText
            .setText(
                formatTimer(
                    missile.timeToImpactMs,
                ) +
                    '  UNKNOWN MISSILE',
            );

        this.bindBeamCommand(
            this.redButton,

            missile.actions
                .fireRedBeam,

            SELECTOR.redBorderColor,
            SELECTOR.redBackgroundColor,
        );

        this.bindBeamCommand(
            this.blueButton,

            missile.actions
                .fireBlueBeam,

            SELECTOR.blueBorderColor,
            SELECTOR.blueBackgroundColor,
        );
    }

    private bindBeamCommand(
        button:
            BeamSelectorButton,

        command:
            BridgeOfficerCommandSelectedPayload |
            undefined,

        activeBorderColor:
            number,

        activeBackgroundColor:
            number,
    ): void {
        button.handler =
            command
                ? () => {
                      this.emitCommand(
                          command,
                      );

                      this.closeBeamSelector();
                  }
                : undefined;

        this.applySelectorButtonState(
            button,
            Boolean(command),
            activeBorderColor,
            activeBackgroundColor,
        );
    }

    private emitCommand(
        command:
            BridgeOfficerCommandSelectedPayload,
    ): void {
        this.eventBus.emit(
            BRIDGE_EVENT
                .OFFICER_COMMAND_SELECTED,

            command,
        );
    }

    private createSelectorButton(
        x: number,
        y: number,
        width: number,
        height: number,
        text: string,
    ): BeamSelectorButton {
        const button:
            BeamSelectorButton = {
                background:
                    this.scene.add
                        .rectangle(
                            x,
                            y,

                            width,
                            height,

                            SELECTOR
                                .disabledBackgroundColor,
                            1,
                        )
                        .setOrigin(0, 0)
                        .setStrokeStyle(
                            1,
                            SELECTOR
                                .disabledBorderColor,
                        ),

                label:
                    this.scene.add
                        .bitmapText(
                            x +
                                width /
                                    2,

                            y +
                                height /
                                    2,

                            FONT_FAMILY.VGA_8X14,
                            text,
                            FONT_SIZE.PX_16,
                        )
                        .setOrigin(
                            0.5,
                            0.5,
                        )
                        .setTint(
                            SELECTOR
                                .disabledTextColor,
                        ),
            };

        button.background.on(
            'pointerdown',
            () => {
                button.handler?.();
            },
        );

        return button;
    }

    private applySelectorButtonState(
        button:
            BeamSelectorButton,

        isActive: boolean,

        activeBorderColor:
            number,

        activeBackgroundColor:
            number,
    ): void {
        button.background
            .disableInteractive();

        if (!isActive) {
            button.background
                .setFillStyle(
                    SELECTOR
                        .disabledBackgroundColor,
                    1,
                )
                .setStrokeStyle(
                    1,
                    SELECTOR
                        .disabledBorderColor,
                );

            button.label.setTint(
                SELECTOR
                    .disabledTextColor,
            );

            return;
        }

        button.background
            .setFillStyle(
                activeBackgroundColor,
                1,
            )
            .setStrokeStyle(
                1,
                activeBorderColor,
            )
            .setInteractive({
                useHandCursor: true,
            });

        button.label.setTint(
            activeBorderColor,
        );
    }

    private destroySelectorButton(
        button:
            BeamSelectorButton,
    ): void {
        button.handler =
            undefined;

        button.background
            .removeAllListeners();

        button.background
            .destroy();

        button.label
            .destroy();
    }

    private clearRows(): void {
        for (
            const rowView
            of this.rowViews
        ) {
            rowView.destroy();
        }

        this.rowViews.length = 0;
    }
}

function formatTimer(
    timeToImpactMs: number,
): string {
    return (
        Math.max(
            0,
            timeToImpactMs,
        ) /
        1000
    ).toFixed(1) + 's';
}
