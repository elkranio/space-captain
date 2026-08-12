import {
    FONT_COLOR,
    FONT_FAMILY,
    FONT_SIZE,
} from '../../../../../../../theme/font';
import type BridgeScene from '../../../../BridgeScene';
import type {
    BridgeCaptainStickyMinePayload,
    BridgeOfficerCommandSelectedPayload,
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

    buttonWidth: 54,
    buttonHeight: 27,
    buttonGap: 4,
    buttonMarginRight: 6,
    buttonY: 4,

    disabledBackgroundColor: 0x101923,
    disabledBorderColor: 0x26394c,
    disabledTextColor: 0x536778,

    actionActiveBackgroundColor:
        0x193147,
    actionActiveBorderColor:
        0x7aa0c4,
} as const;

type MineActionKey =
    keyof BridgeCaptainStickyMinePayload[
        'actions'
    ];

type MineActionSlot = {
    key: MineActionKey;
    label: string;
};

const ACTION_SLOTS = [
    {
        key: 'scienceClear',
        label: 'SCI',
    },
    {
        key: 'helmClear',
        label: 'HELM',
    },
    {
        key: 'weaponsClear',
        label: 'WPN',
    },
    {
        key: 'engineerClear',
        label: 'ENG',
    },
] satisfies readonly MineActionSlot[];

type MineButton = {
    key: MineActionKey;

    background:
        Phaser.GameObjects.Rectangle;

    label:
        Phaser.GameObjects.BitmapText;

    handler?:
        () => void;
};

type StickyMineThreatRowCallbacks = {
    onClear:
        (
            command:
                BridgeOfficerCommandSelectedPayload,
        ) => void;
};

// Temporary captain-dashboard mine row.
//
// Four fixed role slots reflect the real CLEAR MINE command,
// but only the engine-selected isNextClearTarget row can expose actions.
// This intentionally stays mine-specific while threat geometry is provisional.
export default class BridgeCaptainStickyMineThreatRowView {
    private readonly root:
        Phaser.GameObjects.Container;

    private readonly timerText:
        Phaser.GameObjects.BitmapText;

    private readonly threatLabel:
        Phaser.GameObjects.BitmapText;

    private readonly buttons:
        MineButton[];

    constructor(
        private readonly scene:
            BridgeScene,

        width: number,
        height: number,

        private readonly callbacks:
            StickyMineThreatRowCallbacks,
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
                    'MINE',
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
                    'STICKY MINE',
                    FONT_SIZE.PX_16,
                )
                .setOrigin(0, 0)
                .setTint(
                    FONT_COLOR.PRIMARY,
                );

        const totalButtonWidth =
            ACTION_SLOTS.length *
                ROW.buttonWidth +
            (ACTION_SLOTS.length - 1) *
                ROW.buttonGap;

        const firstButtonX =
            width -
            ROW.buttonMarginRight -
            totalButtonWidth;

        this.buttons =
            ACTION_SLOTS.map(
                (slot, index) => {
                    return this.createButton(
                        slot.key,

                        firstButtonX +
                            index *
                                (ROW.buttonWidth +
                                    ROW.buttonGap),

                        slot.label,
                    );
                },
            );

        this.root.add([
            background,
            this.timerText,
            iconBackground,
            iconLabel,
            this.threatLabel,
            ...this.buttons.flatMap(
                (button) => {
                    return [
                        button.background,
                        button.label,
                    ];
                },
            ),
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
        mine:
            BridgeCaptainStickyMinePayload,
    ): void {
        this.timerText.setText(
            formatTimer(
                mine.timeToDetonationMs,
            ),
        );

        this.threatLabel.setText(
            mine.isBeingCleared
                ? 'CLEARING MINE'
                : 'STICKY MINE',
        );

        for (const button of this.buttons) {
            this.setAction(
                button,

                mine.isNextClearTarget
                    ? mine.actions[
                          button.key
                      ]
                    : undefined,
            );
        }
    }

    public destroy(): void {
        for (const button of this.buttons) {
            button.handler =
                undefined;

            button.background
                .removeAllListeners();
        }

        this.root.destroy(true);
    }

    private createButton(
        key: MineActionKey,
        x: number,
        labelText: string,
    ): MineButton {
        const button:
            MineButton = {
                key,

                background:
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
                        ),

                label:
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
                            FONT_SIZE.PX_14,
                        )
                        .setOrigin(
                            0.5,
                            0.5,
                        )
                        .setTint(
                            ROW.disabledTextColor,
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

    private setAction(
        button: MineButton,

        command:
            BridgeOfficerCommandSelectedPayload |
            undefined,
    ): void {
        button.background
            .disableInteractive();

        button.handler =
            undefined;

        if (!command) {
            button.background
                .setFillStyle(
                    ROW.disabledBackgroundColor,
                    1,
                )
                .setStrokeStyle(
                    1,
                    ROW.disabledBorderColor,
                );

            button.label
                .setTint(
                    ROW.disabledTextColor,
                );

            return;
        }

        button.handler =
            () => {
                this.callbacks
                    .onClear(
                        command,
                    );
            };

        button.background
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

        button.label
            .setTint(
                FONT_COLOR.WHITE,
            );
    }
}

function formatTimer(
    timeToDetonationMs: number,
): string {
    return (
        Math.max(
            0,
            timeToDetonationMs,
        ) /
        1000
    ).toFixed(1) + 's';
}
