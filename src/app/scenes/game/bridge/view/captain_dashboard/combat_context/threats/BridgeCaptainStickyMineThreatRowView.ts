import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainStickyMinePayload,
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
    engineerButtonX: 5,

    roleOffsetX: 9,
    roleOffsetY: 10,

    labelRightInset: 10,
    labelOffsetY: 14,

    disabledAlpha: 0.35,
} as const;

const TIMING_STRIP = {
    offsetX: 12,
    offsetY: 22,
    width: 52,
    height: 3,

    expiredWidth: 3,
    blinkPeriodMs: 300,

    trackColor: 0x263146,
    fillColor: 0xf2e4bc,
} as const;

type StickyMineThreatRowCallbacks = {
    onClear: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;

    timingTrack: Phaser.GameObjects.Rectangle;
    timingFill: Phaser.GameObjects.Rectangle;
    timingExpired: Phaser.GameObjects.Rectangle;
};

// Sticky Mine использует общий production-like threat tile.
// CLEAR остаётся Engineer-only, а верхняя середина намеренно пустая:
// текущие mine-state labels не меняют решение игрока.
export default class BridgeCaptainStickyMineThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly engineerAction: ActionButton;

    private engineerCommand?: BridgeOfficerCommandSelectedPayload;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: StickyMineThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const mineIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_MINE, TILE.iconX, TILE.iconY);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.engineerAction = this.createActionButton(TILE.engineerButtonX, UI_COMBAT_SPRITE_ID.ROLE_E, "CLEAR");

        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            mineIcon,
            this.timerText,
            this.engineerAction.background,
            this.engineerAction.roleGlyph,
            this.engineerAction.label,
            this.engineerAction.timingTrack,
            this.engineerAction.timingFill,
            this.engineerAction.timingExpired,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(mine: BridgeCaptainStickyMinePayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(mine.timeToDetonationMs));

        const engineerClearTaskId = mine.activeTasks?.engineerClearTaskId;

        this.setEngineerAction(mine.actions.engineerClear, engineerClearTaskId);

        this.updateActionTiming(
            mine.timeToDetonationMs,
            mine.initialTimeToDetonationMs,
            mine.decisionTimings?.clearMinRemainingMs,
            engineerClearTaskId !== undefined,
        );
    }

    public destroy(): void {
        this.engineerAction.background.off("pointerdown", this.handleEngineerPointerDown, this);

        this.engineerCommand = undefined;
        this.engineerTaskId = undefined;

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

        const timingX = x + TIMING_STRIP.offsetX;
        const timingY = TILE.buttonY + TIMING_STRIP.offsetY;

        const timingTrack = this.scene.add
            .rectangle(
                timingX,
                timingY,
                TIMING_STRIP.width,
                TIMING_STRIP.height,
                TIMING_STRIP.trackColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        const timingFill = this.scene.add
            .rectangle(
                timingX + TIMING_STRIP.width,
                timingY,
                TIMING_STRIP.width,
                TIMING_STRIP.height,
                TIMING_STRIP.fillColor,
                1,
            )
            .setOrigin(1, 0)
            .setVisible(false);

        const timingExpired = this.scene.add
            .rectangle(
                timingX + TIMING_STRIP.width - TIMING_STRIP.expiredWidth,
                timingY,
                TIMING_STRIP.expiredWidth,
                TIMING_STRIP.height,
                FONT_COLOR.DANGER,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        return {
            background,
            roleGlyph,
            label,
            timingTrack,
            timingFill,
            timingExpired,
        };
    }

    private setEngineerAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.engineerCommand = command;
        this.engineerTaskId = taskId;
        this.setActionState(this.engineerAction, command !== undefined, taskId !== undefined);
    }

    private updateActionTiming(
        remainingMs: number,
        initialRemainingMs: number,
        latestUsefulStartRemainingMs: number | null | undefined,
        actionIsActive: boolean,
    ): void {
        const action = this.engineerAction;

        if (actionIsActive || latestUsefulStartRemainingMs === undefined) {
            this.hideActionTiming();
            return;
        }

        action.timingTrack.setVisible(true);

        if (latestUsefulStartRemainingMs === null) {
            this.showExpiredActionTiming();
            return;
        }

        const usefulWindowMs = initialRemainingMs - latestUsefulStartRemainingMs;
        const usefulRemainingMs = remainingMs - latestUsefulStartRemainingMs;

        if (usefulWindowMs <= 0 || usefulRemainingMs <= 0) {
            this.showExpiredActionTiming();
            return;
        }

        const fill01 = Math.max(0, Math.min(1, usefulRemainingMs / usefulWindowMs));

        action.timingFill.setVisible(true).setScale(fill01, 1);
        action.timingExpired.setVisible(false);
    }

    private showExpiredActionTiming(): void {
        this.engineerAction.timingFill.setVisible(false);

        const blinkOn = Math.floor(this.scene.time.now / TIMING_STRIP.blinkPeriodMs) % 2 === 0;

        this.engineerAction.timingExpired.setVisible(blinkOn);
    }

    private hideActionTiming(): void {
        this.engineerAction.timingTrack.setVisible(false);
        this.engineerAction.timingFill.setVisible(false);
        this.engineerAction.timingExpired.setVisible(false);
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

    private handleEngineerPointerDown(): void {
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

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
