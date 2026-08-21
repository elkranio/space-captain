// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainMissileThreatRowView.ts
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
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

    weaponsActionX: 77,
    weaponsActionWidth: 76,

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

type MissileThreatRowCallbacks = {
    onIntercept: (command: BridgeOfficerCommandSelectedPayload) => void;
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

// Missile uses direct threat facts.
// HIT is the only local action; the left action half stays intentionally empty.
export default class BridgeCaptainMissileThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;

    private readonly weaponsAction: ActionButton;

    private weaponsCommand?: BridgeOfficerCommandSelectedPayload;

    private weaponsTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: MissileThreatRowCallbacks,
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

        const missileIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_MISSILE,
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

        this.weaponsAction = this.createActionButton(
            TILE.weaponsActionX,
            TILE.weaponsActionWidth,
            UI_COMBAT_SPRITE_ID.ROLE_W,
            "HIT",
        );

        this.weaponsAction.background.on("pointerdown", this.handleWeaponsPointerDown, this);

        this.root.add([
            background,
            this.weaponsAction.background,
            missileIcon,
            this.timerText,
            this.weaponsAction.roleGlyph,
            this.weaponsAction.label,
            this.weaponsAction.timingTrack,
            this.weaponsAction.timingFill,
            this.weaponsAction.timingExpired,
            ...this.weaponsAction.timingDividers,
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

    public update(missile: BridgeCaptainIncomingMissilePayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(missile.timeToImpactMs));

        const interceptMissileTaskId = missile.activeTasks?.interceptMissileTaskId;

        this.setWeaponsAction(missile.actions.interceptMissile, interceptMissileTaskId);

        this.updateActionTiming(
            this.weaponsAction,
            missile.timeToImpactMs,
            missile.initialTimeToImpactMs,
            missile.decisionTimings?.interceptMissileMinRemainingMs,
        );
    }

    public destroy(): void {
        this.weaponsAction.background.off("pointerdown", this.handleWeaponsPointerDown, this);

        this.weaponsCommand = undefined;

        this.weaponsTaskId = undefined;

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

    private setWeaponsAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.setActionVisible(this.weaponsAction, true);

        this.weaponsCommand = command;
        this.weaponsTaskId = taskId;
        this.setActionState(this.weaponsAction, command !== undefined, taskId !== undefined);
    }

    private setActionVisible(action: ActionButton, visible: boolean): void {
        action.background.setVisible(visible);
        action.roleGlyph.setVisible(visible);
        action.label.setVisible(visible);

        if (!visible) {
            this.hideActionTiming(action);
        }
    }

    private updateActionTiming(
        action: ActionButton,
        remainingMs: number,
        initialRemainingMs: number,
        latestUsefulStartRemainingMs: number | null | undefined,
    ): void {
        if (!action.background.visible || latestUsefulStartRemainingMs === undefined) {
            this.hideActionTiming(action);
            return;
        }

        action.timingTrack.setVisible(true);
        action.timingDividers.forEach((divider) => divider.setVisible(true));

        if (latestUsefulStartRemainingMs === null) {
            this.showExpiredActionTiming(action);
            return;
        }

        const usefulWindowMs = initialRemainingMs - latestUsefulStartRemainingMs;
        const usefulRemainingMs = remainingMs - latestUsefulStartRemainingMs;

        if (usefulWindowMs <= 0 || usefulRemainingMs <= 0) {
            this.showExpiredActionTiming(action);
            return;
        }

        const fill01 = Math.max(0, Math.min(1, usefulRemainingMs / usefulWindowMs));

        action.timingFill.setVisible(true).setScale(fill01, 1);
        action.timingExpired.setVisible(false);
    }

    private showExpiredActionTiming(action: ActionButton): void {
        action.timingFill.setVisible(false);

        const blinkOn = Math.floor(this.scene.time.now / TIMING_STRIP.blinkPeriodMs) % 2 === 0;

        action.timingExpired.setVisible(blinkOn);
    }

    private hideActionTiming(action: ActionButton): void {
        action.timingTrack.setVisible(false);
        action.timingFill.setVisible(false);
        action.timingDividers.forEach((divider) => divider.setVisible(false));
        action.timingExpired.setVisible(false);
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

    private handleWeaponsPointerDown(): void {
        if (this.weaponsTaskId) {
            this.callbacks.onCancelTask(this.weaponsTaskId);
            return;
        }

        if (!this.weaponsCommand) {
            return;
        }

        this.callbacks.onIntercept(this.weaponsCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
