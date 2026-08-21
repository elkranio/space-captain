import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainStickyMinePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { THREAT_CELL, THREAT_GLYPH_COLOR } from "./threat_glyph_style";

type StickyMineThreatGlyphCallbacks = {
    onClear: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

export default class BridgeCaptainStickyMineThreatGlyphView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hitArea: Phaser.GameObjects.Rectangle;

    private readonly mineIcon: Phaser.GameObjects.Image;
    private readonly mineDangerIcon: Phaser.GameObjects.Image;

    private readonly roleGlyph: Phaser.GameObjects.Image;
    private readonly actionLabel: Phaser.GameObjects.Text;

    private engineerCommand?: BridgeOfficerCommandSelectedPayload;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: StickyMineThreatGlyphCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hitArea = this.scene.add
            .rectangle(0, 0, THREAT_CELL.width, THREAT_CELL.height, 0xffffff, 0)
            .setOrigin(0, 0);

        this.mineIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MINE,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        ).setTintFill(THREAT_GLYPH_COLOR.MINE);

        this.mineDangerIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MINE,
            THREAT_CELL.glyphX,
            THREAT_CELL.glyphY,
        )
            .setTintFill(FONT_COLOR.DANGER)
            .setVisible(false);

        this.roleGlyph = this.createSprite(
            UI_COMBAT_SPRITE_ID.ROLE_E,
            0,
            THREAT_CELL.actionCenterY,
        ).setOrigin(0, 0.5);

        this.actionLabel = this.scene.add
            .text(0, THREAT_CELL.actionCenterY, "CLEAR", {
                fontFamily: "Anta",
                fontSize: "10px",
                color: "#ffffff",
                resolution: 1,
            })
            .setOrigin(0, 0.5);

        this.hitArea.on("pointerdown", this.handlePointerDown, this);

        this.root.add([
            this.hitArea,
            this.mineIcon,
            this.mineDangerIcon,
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

    public update(mine: BridgeCaptainStickyMinePayload): void {
        const engineerClearTaskId = mine.activeTasks?.engineerClearTaskId;

        this.engineerCommand = mine.actions.engineerClear;
        this.engineerTaskId = engineerClearTaskId;

        this.updateActionState(
            mine.actions.engineerClear !== undefined,
            engineerClearTaskId !== undefined,
        );

        this.updateGlyphTiming(
            mine.timeToDetonationMs,
            mine.initialTimeToDetonationMs,
            mine.decisionTimings?.clearMinRemainingMs,
        );
    }

    public destroy(): void {
        this.hitArea.off("pointerdown", this.handlePointerDown, this);

        this.engineerCommand = undefined;
        this.engineerTaskId = undefined;

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

    private updateActionState(enabled: boolean, active: boolean): void {
        this.hitArea.disableInteractive();

        if (enabled || active) {
            this.hitArea.setInteractive({
                useHandCursor: true,
            });
        }

        this.actionLabel.setText(active ? "CANCEL" : "CLEAR");

        const alpha = enabled || active ? 1 : THREAT_CELL.disabledAlpha;

        this.roleGlyph.setAlpha(alpha);
        this.actionLabel.setAlpha(alpha);

        this.layoutActionLabel();
    }

    private updateGlyphTiming(
        remainingMs: number,
        initialRemainingMs: number,
        latestUsefulStartRemainingMs: number | null | undefined,
    ): void {
        this.mineIcon.setVisible(true);
        this.mineDangerIcon.setVisible(false);

        if (latestUsefulStartRemainingMs === undefined) {
            return;
        }

        if (latestUsefulStartRemainingMs === null) {
            this.showTerminalGlyph();
            return;
        }

        const usefulWindowMs = initialRemainingMs - latestUsefulStartRemainingMs;
        const usefulRemainingMs = remainingMs - latestUsefulStartRemainingMs;

        if (usefulWindowMs <= 0 || usefulRemainingMs <= 0) {
            this.showTerminalGlyph();
            return;
        }

        const usefulRemaining01 = Math.max(0, Math.min(1, usefulRemainingMs / usefulWindowMs));
        const dangerProgress01 = 1 - usefulRemaining01;

        if (dangerProgress01 <= 0) {
            return;
        }

        const cropWidth = Math.round(this.mineDangerIcon.width * dangerProgress01);

        if (cropWidth <= 0) {
            return;
        }

        this.mineDangerIcon
            .setCrop(0, 0, cropWidth, this.mineDangerIcon.height)
            .setVisible(true);
    }

    private showTerminalGlyph(): void {
        const blinkOn =
            Math.floor(this.scene.time.now / THREAT_CELL.terminalBlinkPeriodMs) % 2 === 0;

        this.mineIcon.setVisible(false);
        this.mineDangerIcon
            .setCrop(0, 0, this.mineDangerIcon.width, this.mineDangerIcon.height)
            .setVisible(blinkOn);
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
        if (this.engineerTaskId) {
            this.callbacks.onCancelTask(this.engineerTaskId);
            return;
        }

        if (!this.engineerCommand) {
            return;
        }

        this.callbacks.onClear(this.engineerCommand);
    }
}

type UiCombatSpriteId =
    (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
