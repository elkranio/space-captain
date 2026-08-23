import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainSpamChannelPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { getThreatActiveTaskRoleAlpha, THREAT_CELL, THREAT_GLYPH_COLOR } from "./threat_glyph_style";

type SpamThreatGlyphCallbacks = {
    onPurge: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

export default class BridgeCaptainSpamThreatGlyphView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hitArea: Phaser.GameObjects.Rectangle;

    private readonly spamExpiredIcon: Phaser.GameObjects.Image;

    private readonly roleGlyph: Phaser.GameObjects.Image;
    private readonly actionLabel: Phaser.GameObjects.Text;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private scienceTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: SpamThreatGlyphCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hitArea = this.scene.add
            .rectangle(0, 0, THREAT_CELL.width, THREAT_CELL.height, 0xffffff, 0)
            .setOrigin(0, 0);

        const spamIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_SPAM,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        ).setTintFill(THREAT_GLYPH_COLOR.SPAM);

        this.spamExpiredIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_SPAM,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        )
            .setTintFill(THREAT_GLYPH_COLOR.SPAM_EXPIRED)
            .setVisible(false);

        this.roleGlyph = this.createSprite(
            UI_COMBAT_SPRITE_ID.ROLE_S,
            0,
            THREAT_CELL.actionCenterY,
        ).setOrigin(0, 0.5);

        this.actionLabel = this.scene.add
            .text(0, THREAT_CELL.actionCenterY, "PURGE", {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
                resolution: 1,
            })
            .setOrigin(0, 0.5);

        this.hitArea.on("pointerdown", this.handlePointerDown, this);

        this.root.add([
            this.hitArea,
            spamIcon,
            this.spamExpiredIcon,
            this.roleGlyph,
            this.actionLabel,
        ]);

        this.layoutActionLabel();
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(channel: BridgeCaptainSpamChannelPayload): void {
        this.scienceCommand = channel.actions.purgeSpam;
        this.scienceTaskId = channel.activeTasks?.purgeSpamTaskId;

        this.updateActionState(
            this.scienceCommand !== undefined,
            this.scienceTaskId !== undefined,
        );

        this.updateDurationProgress(
            channel.remainingDurationMs,
            channel.initialDurationMs,
        );
    }

    public destroy(): void {
        this.hitArea.off("pointerdown", this.handlePointerDown, this);

        this.scienceCommand = undefined;
        this.scienceTaskId = undefined;

        this.root.destroy(true);
    }

    private createSprite(
        spriteId: UiCombatSpriteId,
        x: number,
        y: number,
    ): Phaser.GameObjects.Image {
        const sprite = UI_COMBAT_SPRITES[spriteId];

        return this.scene.add.image(x, y, sprite.atlasKey, sprite.frameKey).setOrigin(0, 0);
    }

    private updateDurationProgress(remainingMs: number, initialDurationMs: number): void {
        this.spamExpiredIcon.setVisible(false);

        if (initialDurationMs <= 0) {
            return;
        }

        const remaining01 = Math.max(0, Math.min(1, remainingMs / initialDurationMs));
        const expired01 = 1 - remaining01;

        if (expired01 <= 0) {
            return;
        }

        const cropWidth = Math.round(this.spamExpiredIcon.width * expired01);

        if (cropWidth <= 0) {
            return;
        }

        this.spamExpiredIcon
            .setCrop(0, 0, cropWidth, this.spamExpiredIcon.height)
            .setVisible(true);
    }

    private updateActionState(enabled: boolean, active: boolean): void {
        this.hitArea.disableInteractive();

        if (enabled || active) {
            this.hitArea.setInteractive({
                useHandCursor: true,
            });
        }

        this.actionLabel.setText(active ? "CANCEL" : "PURGE");

        const alpha = enabled || active ? 1 : THREAT_CELL.disabledAlpha;

        this.roleGlyph.setAlpha(active ? getThreatActiveTaskRoleAlpha(this.scene.time.now) : alpha);
        this.actionLabel.setAlpha(alpha);

        this.layoutActionLabel();
    }

    private layoutActionLabel(): void {
        const contentWidth =
            this.roleGlyph.displayWidth + THREAT_CELL.actionGap + this.actionLabel.width;
        const startX = Math.round((THREAT_CELL.width - contentWidth) / 2);

        this.roleGlyph.setPosition(startX, THREAT_CELL.actionCenterY);
        this.actionLabel.setPosition(
            startX + this.roleGlyph.displayWidth + THREAT_CELL.actionGap,
            THREAT_CELL.actionCenterY,
        );
    }

    private handlePointerDown(): void {
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

type UiCombatSpriteId =
    (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
