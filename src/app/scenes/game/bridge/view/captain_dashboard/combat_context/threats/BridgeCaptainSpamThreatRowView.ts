import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainSpamChannelPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

const TILE = {
    iconX: 9,
    iconY: 8,

    timerX: 154,
    timerY: 8,

    buttonWidth: 75,
    buttonY: 34,
    scienceButtonX: 5,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelRightInset: 10,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

type SpamThreatRowCallbacks = {
    onPurge: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
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

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const spamIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_SPAM, TILE.iconX, TILE.iconY);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(TILE.scienceButtonX, UI_COMBAT_SPRITE_ID.ROLE_S, "PURGE");

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);

        this.root.add([
            background,
            spamIcon,
            this.timerText,
            this.scienceAction.background,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
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

    private createActionButton(x: number, roleSpriteId: UiCombatSpriteId, labelText: string): ActionButton {
        const background = this.createSprite(UI_COMBAT_SPRITE_ID.ACTION_BUTTON_BG, x, TILE.buttonY);

        const roleGlyph = this.createSprite(roleSpriteId, x + TILE.roleOffsetX, TILE.buttonY + TILE.roleOffsetY);

        const label = this.scene.add
            .text(x + TILE.buttonWidth - TILE.labelRightInset, TILE.buttonY + TILE.labelOffsetY, labelText, {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
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
        action.background.clearTint();
        action.label.clearTint();

        if (enabled || active) {
            action.background.setInteractive({
                useHandCursor: true,
            });
        }

        if (active) {
            action.background.setTint(FONT_COLOR.ACTIVITY);
            action.label.setTint(FONT_COLOR.ACTIVITY);
        }

        const alpha = enabled || active ? 1 : TILE.disabledAlpha;

        action.background.setAlpha(alpha);
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
