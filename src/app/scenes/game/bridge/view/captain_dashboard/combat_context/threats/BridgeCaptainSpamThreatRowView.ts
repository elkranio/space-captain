import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";
import type {
    BridgeCaptainSpamChannelPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";

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
    buttonMarginRight: 6,
    buttonY: 4,
} as const;

type SpamThreatRowCallbacks = {
    onPurge: (command: BridgeOfficerCommandSelectedPayload) => void;
};

// Active hostile SPAM channel.
//
// The timer is time until natural channel expiry.
// SCI action is present only when the engine currently exposes
// SCIENCE_PURGE_SPAM for this exact channel id.
export default class BridgeCaptainSpamThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;

    private readonly scienceButton: Phaser.GameObjects.Rectangle;

    private readonly scienceLabel: Phaser.GameObjects.BitmapText;

    private scienceHandler?: () => void;

    constructor(
        private readonly scene: BridgeScene,

        width: number,
        height: number,

        private readonly callbacks: SpamThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const visibleHeight = Math.max(1, height - ROW.verticalGap);

        const background = this.scene.add
            .rectangle(
                0,
                0,

                width,
                visibleHeight,

                CAPTAIN_DASHBOARD_STYLE.row.backgroundColor,
                CAPTAIN_DASHBOARD_STYLE.row.backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(CAPTAIN_DASHBOARD_STYLE.row.borderThickness, CAPTAIN_DASHBOARD_STYLE.row.borderColor);

        this.timerText = this.scene.add
            .bitmapText(
                ROW.timerX,
                ROW.timerY,

                FONT_FAMILY.VGA_8X14,
                "--.-s",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.ACTIVITY);

        const iconBackground = this.scene.add
            .rectangle(
                ROW.iconX,
                ROW.iconY,

                ROW.iconWidth,
                ROW.iconHeight,

                CAPTAIN_DASHBOARD_STYLE.row.iconBackgroundColor,
                1,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.row.iconBorderColor);

        const iconLabel = this.scene.add
            .bitmapText(
                ROW.iconX + ROW.iconWidth / 2,

                ROW.iconY + ROW.iconHeight / 2,

                FONT_FAMILY.VGA_8X14,
                "SPAM",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0.5, 0.5)
            .setTint(FONT_COLOR.SECONDARY);

        const threatLabel = this.scene.add
            .bitmapText(
                ROW.labelX,
                ROW.labelY,

                FONT_FAMILY.VGA_8X14,
                "SPAM CHANNEL",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0, 0)
            .setTint(FONT_COLOR.PRIMARY);

        const scienceX = width - ROW.buttonMarginRight - ROW.buttonWidth;

        this.scienceButton = this.scene.add
            .rectangle(
                scienceX,
                ROW.buttonY,

                ROW.buttonWidth,
                ROW.buttonHeight,

                CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor,
                1,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor);

        this.scienceLabel = this.scene.add
            .bitmapText(
                scienceX + ROW.buttonWidth / 2,

                ROW.buttonY + ROW.buttonHeight / 2,

                FONT_FAMILY.VGA_8X14,
                "SCI",
                FONT_SIZE.PX_16,
            )
            .setOrigin(0.5, 0.5)
            .setTint(CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor);

        this.scienceButton.on("pointerdown", this.handleSciencePointerDown, this);

        this.root.add([
            background,
            this.timerText,
            iconBackground,
            iconLabel,
            threatLabel,
            this.scienceButton,
            this.scienceLabel,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(channel: BridgeCaptainSpamChannelPayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(channel.remainingDurationMs));

        this.setScienceAction(channel.actions.purgeSpam);
    }

    public destroy(): void {
        this.scienceButton.off("pointerdown", this.handleSciencePointerDown, this);

        this.scienceHandler = undefined;

        this.root.destroy(true);
    }

    private setScienceAction(command: BridgeOfficerCommandSelectedPayload | undefined): void {
        this.scienceButton.disableInteractive();

        this.scienceHandler = undefined;

        if (!command) {
            this.scienceButton
                .setFillStyle(CAPTAIN_DASHBOARD_STYLE.action.disabledBackgroundColor, 1)
                .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.disabledBorderColor);

            this.scienceLabel.setTint(CAPTAIN_DASHBOARD_STYLE.action.disabledTextColor);

            return;
        }

        this.scienceHandler = () => {
            this.callbacks.onPurge(command);
        };

        this.scienceButton
            .setFillStyle(CAPTAIN_DASHBOARD_STYLE.action.activeBackgroundColor, 1)
            .setStrokeStyle(1, CAPTAIN_DASHBOARD_STYLE.action.activeBorderColor)
            .setInteractive({
                useHandCursor: true,
            });

        this.scienceLabel.setTint(FONT_COLOR.WHITE);
    }

    private handleSciencePointerDown(): void {
        this.scienceHandler?.();
    }
}
