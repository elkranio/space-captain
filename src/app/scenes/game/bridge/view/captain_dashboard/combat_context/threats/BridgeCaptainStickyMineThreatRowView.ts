import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainStickyMinePayload,
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

    engineerActionX: 77,
    engineerActionWidth: 76,

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

const TIMING_STRIP = {
    height: 6,

    expiredWidth: 3,
    segmentCount: 7,
    segmentWidth: 10,
    dividerWidth: 1,
    blinkPeriodMs: 300,

    trackColor: 0x31465b,
    dividerColor: 0x172a38,
    fillColor: 0x5f9fb5,
} as const;

type StickyMineThreatRowCallbacks = {
    onClear: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Rectangle;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;

    timingTrack: Phaser.GameObjects.Rectangle;
    timingFill: Phaser.GameObjects.Rectangle;
    timingDividers: Phaser.GameObjects.Rectangle[];
    timingExpired: Phaser.GameObjects.Rectangle;
};

// Sticky Mine использует тот же flat threat tile grammar, что Missile и Beam.
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

        const mineIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MINE,
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

        this.engineerAction = this.createActionButton(
            TILE.engineerActionX,
            TILE.engineerActionWidth,
            UI_COMBAT_SPRITE_ID.ROLE_E,
            "CLEAR",
        );

        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            this.engineerAction.background,
            mineIcon,
            this.timerText,
            this.engineerAction.roleGlyph,
            this.engineerAction.label,
            this.engineerAction.timingTrack,
            this.engineerAction.timingFill,
            this.engineerAction.timingExpired,
            ...this.engineerAction.timingDividers,
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

    public update(mine: BridgeCaptainStickyMinePayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(mine.timeToDetonationMs));

        const engineerClearTaskId = mine.activeTasks?.engineerClearTaskId;

        this.setEngineerAction(mine.actions.engineerClear, engineerClearTaskId);

        this.updateActionTiming(
            mine.timeToDetonationMs,
            mine.initialTimeToDetonationMs,
            mine.decisionTimings?.clearMinRemainingMs,
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

        const timingX = x;
        const timingY = TILE.height - TIMING_STRIP.height;

        const timingTrack = this.scene.add
            .rectangle(
                timingX,
                timingY,
                width,
                TIMING_STRIP.height,
                TIMING_STRIP.trackColor,
                1,
            )
            .setOrigin(0, 0)
            .setVisible(false);

        const timingFill = this.scene.add
            .rectangle(
                timingX + width,
                timingY,
                width,
                TIMING_STRIP.height,
                TIMING_STRIP.fillColor,
                1,
            )
            .setOrigin(1, 0)
            .setVisible(false);

        const timingDividers = Array.from({ length: TIMING_STRIP.segmentCount - 1 }, (_, index) => {
            const dividerX =
                timingX +
                TIMING_STRIP.segmentWidth * (index + 1) +
                TIMING_STRIP.dividerWidth * index;

            return this.scene.add
                .rectangle(
                    dividerX,
                    timingY,
                    TIMING_STRIP.dividerWidth,
                    TIMING_STRIP.height,
                    TIMING_STRIP.dividerColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);
        });

        const timingExpired = this.scene.add
            .rectangle(
                timingX + width - TIMING_STRIP.expiredWidth,
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
            timingDividers,
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
    ): void {
        const action = this.engineerAction;

        if (latestUsefulStartRemainingMs === undefined) {
            this.hideActionTiming();
            return;
        }

        action.timingTrack.setVisible(true);
        action.timingDividers.forEach((divider) => divider.setVisible(true));

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
        this.engineerAction.timingDividers.forEach((divider) => divider.setVisible(false));
        this.engineerAction.timingExpired.setVisible(false);
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
