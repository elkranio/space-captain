import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainSpamChannelPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const TILE = {
    width: 153,
    height: 58,

    headerCenterY: 14,
    headerTextY: 8,

    iconCenterX: 26,
    timerCenterX: 128,

    actionY: 28,
    actionDividerX: 76,

    scienceActionX: 77,
    scienceActionWidth: 76,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelRightInset: 10,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

const TILE_STYLE = {
    backgroundColor: 0x111c27,
    actionBackgroundColor: 0x172a38,

    borderColor: 0x8fb5d6,
    separatorColor: 0x45627f,

    activeActionBackgroundColor: 0x5a310e,
    disabledActionBackgroundColor: 0x0d151e,
} as const;

type SpamThreatRowCallbacks = {
    onPurge: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Rectangle;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;
};

// Active hostile SPAM channel.
//
// The timer is time until natural channel expiry.
// SCI action is present only when the engine currently exposes
// SCIENCE_PURGE_SPAM for this exact channel id.
// Spam intentionally has no decision-window progress bar.
export default class BridgeCaptainSpamThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly scienceAction: ActionButton;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private scienceTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: SpamThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.scene.add
            .rectangle(0, 0, TILE.width, TILE.height, TILE_STYLE.backgroundColor, 1)
            .setOrigin(0, 0);

        const outerBorder = this.scene.add
            .rectangle(0, 0, TILE.width, TILE.height, TILE_STYLE.backgroundColor, 0)
            .setOrigin(0, 0)
            .setStrokeStyle(1, TILE_STYLE.borderColor);

        const actionTopBorder = this.scene.add
            .rectangle(0, TILE.actionY, TILE.width, 1, TILE_STYLE.separatorColor, 1)
            .setOrigin(0, 0);

        const actionDivider = this.scene.add
            .rectangle(
                TILE.actionDividerX,
                TILE.actionY,
                1,
                TILE.height - TILE.actionY,
                TILE_STYLE.separatorColor,
                1,
            )
            .setOrigin(0, 0);

        const spamIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_SPAM,
            TILE.iconCenterX,
            TILE.headerCenterY,
        ).setOrigin(0.5, 0.5);

        this.timerText = this.scene.add
            .bitmapText(
                TILE.timerCenterX,
                TILE.headerTextY,
                FONT_FAMILY.VGA_8X14,
                "--.-s",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(
            TILE.scienceActionX,
            TILE.scienceActionWidth,
            UI_COMBAT_SPRITE_ID.ROLE_S,
            "PURGE",
        );

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);

        this.root.add([
            background,
            this.scienceAction.background,
            spamIcon,
            this.timerText,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            actionTopBorder,
            actionDivider,
            outerBorder,
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

        this.setScienceAction(channel.actions.purgeSpam, channel.activeTasks?.purgeSpamTaskId);
    }

    public destroy(): void {
        this.scienceAction.background.off("pointerdown", this.handleSciencePointerDown, this);

        this.scienceCommand = undefined;
        this.scienceTaskId = undefined;

        this.root.destroy(true);
    }

    private createSprite(spriteId: UiCombatSpriteId, x: number, y: number): Phaser.GameObjects.Image {
        const sprite = UI_COMBAT_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }

    private createActionButton(
        x: number,
        width: number,
        roleSpriteId: UiCombatSpriteId,
        labelText: string,
    ): ActionButton {
        const background = this.scene.add
            .rectangle(
                x,
                TILE.actionY,
                width,
                TILE.height - TILE.actionY,
                TILE_STYLE.actionBackgroundColor,
                1,
            )
            .setOrigin(0, 0);

        const roleGlyph = this.createSprite(roleSpriteId, x + TILE.roleOffsetX, TILE.actionY + TILE.roleOffsetY);

        const label = this.scene.add
            .text(x + width - TILE.labelRightInset, TILE.actionY + TILE.labelOffsetY, labelText, {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#d7e6ff",
                resolution: 1,
            })
            .setOrigin(1, 0.5);

        return {
            background,
            roleGlyph,
            label,
        };
    }

    private setScienceAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.scienceCommand = command;
        this.scienceTaskId = taskId;
        this.setActionState(this.scienceAction, command !== undefined, taskId !== undefined);
    }

    private setActionState(action: ActionButton, enabled: boolean, active: boolean): void {
        action.background.disableInteractive();
        action.background.setFillStyle(TILE_STYLE.actionBackgroundColor, 1);
        action.label.clearTint();

        if (enabled || active) {
            action.background.setInteractive({
                useHandCursor: true,
            });
        }

        if (active) {
            action.background.setFillStyle(TILE_STYLE.activeActionBackgroundColor, 1);
            action.label.setTint(FONT_COLOR.ACTIVITY);
        } else if (!enabled) {
            action.background.setFillStyle(TILE_STYLE.disabledActionBackgroundColor, 1);
        }

        const alpha = enabled || active ? 1 : TILE.disabledAlpha;

        action.roleGlyph.setAlpha(alpha);
        action.label.setAlpha(alpha);
    }

    private handleSciencePointerDown(): void {
        if (this.scienceTaskId) {
            this.callbacks.onCancelTask(this.scienceTaskId);
            return;
        }

        if (!this.scienceCommand) {
            return;
        }

        this.callbacks.onPurge(this.scienceCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
