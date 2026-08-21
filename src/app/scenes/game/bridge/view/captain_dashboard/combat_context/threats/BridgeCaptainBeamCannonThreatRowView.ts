// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainBeamCannonThreatRowView.ts
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type { BridgeCaptainIncomingBeamCannonPayload } from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";
import {
    BEAM_SHIELD_TIMING_PHASE,
    getBeamShieldTimingStripState,
} from "./get_beam_shield_timing_strip_state";

const TILE = {
    width: 153,
    height: 58,

    headerCenterY: 14,
    headerTextY: 8,

    iconCenterX: 26,
    statusCenterX: 77,
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
    earlyColor: 0xa8444d,
    fillColor: 0x5f9fb5,
} as const;

type BeamShieldWindow = NonNullable<BridgeCaptainIncomingBeamCannonPayload["decisionTimings"]>["shieldWindow"];

type BeamCannonThreatRowCallbacks = {
    onOpenShieldTargeting: () => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Rectangle;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;

    timingTrack: Phaser.GameObjects.Rectangle;
    timingFill: Phaser.GameObjects.Rectangle;
    timingEarly: Phaser.GameObjects.Rectangle;
    timingDividers: Phaser.GameObjects.Rectangle[];
    timingExpired: Phaser.GameObjects.Rectangle;
};

// Beam Cannon uses direct target facts from presentation.
// SHIELD is the only local action; the left action half stays intentionally empty.
export default class BridgeCaptainBeamCannonThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly targetText: Phaser.GameObjects.BitmapText;

    private readonly engineerAction: ActionButton;

    private shieldTargetingAvailable = false;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: BeamCannonThreatRowCallbacks,
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

        const beamCannonIcon = this.createSprite(
            UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON,
            TILE.iconCenterX,
            TILE.headerCenterY,
        ).setOrigin(0.5, 0.5);

        this.targetText = this.scene.add
            .bitmapText(
                TILE.statusCenterX,
                TILE.headerTextY,
                FONT_FAMILY.VGA_8X14,
                "--",
                FONT_SIZE.PX_14,
            )
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.SECONDARY);

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
            "SHIELD",
        );

        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            this.engineerAction.background,
            beamCannonIcon,
            this.targetText,
            this.timerText,
            this.engineerAction.roleGlyph,
            this.engineerAction.label,
            this.engineerAction.timingTrack,
            this.engineerAction.timingFill,
            this.engineerAction.timingEarly,
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

    public update(
        beamCannon: BridgeCaptainIncomingBeamCannonPayload,
        shieldTargetingAvailable: boolean,
        shieldDeployTaskId: string | undefined,
    ): void {
        this.timerText.setText(formatCaptainDashboardCountdown(beamCannon.timeToFireMs));

        this.targetText
            .setText(beamCannon.targetNode.toUpperCase())
            .setTint(FONT_COLOR.SECONDARY);

        this.shieldTargetingAvailable = shieldTargetingAvailable;
        this.engineerTaskId = shieldDeployTaskId;

        this.setEngineerAction(
            shieldTargetingAvailable,
            shieldDeployTaskId !== undefined,
        );

        this.updateShieldTiming(
            beamCannon.timeToFireMs,
            beamCannon.initialTimeToFireMs,
            beamCannon.decisionTimings?.shieldWindow,
        );
    }

    public destroy(): void {
        this.engineerAction.background.off("pointerdown", this.handleEngineerPointerDown, this);

        this.shieldTargetingAvailable = false;
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

        const timingEarly = this.scene.add
            .rectangle(
                timingX,
                timingY,
                width,
                TIMING_STRIP.height,
                TIMING_STRIP.earlyColor,
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
            timingEarly,
            timingDividers,
            timingExpired,
        };
    }

    private setEngineerAction(enabled: boolean, active: boolean): void {
        this.setActionVisible(this.engineerAction, true);
        this.setActionState(this.engineerAction, enabled, active);
    }

    private setActionVisible(action: ActionButton, visible: boolean): void {
        action.background.setVisible(visible);
        action.roleGlyph.setVisible(visible);
        action.label.setVisible(visible);

        if (!visible) {
            this.hideActionTiming(action);
        }
    }

    private updateShieldTiming(
        remainingMs: number,
        initialRemainingMs: number,
        shieldWindow: BeamShieldWindow | undefined,
    ): void {
        const action = this.engineerAction;

        if (!action.background.visible) {
            this.hideActionTiming(action);
            return;
        }

        const timing = getBeamShieldTimingStripState({
            remainingMs,
            initialRemainingMs,
            shieldWindow,
        });

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.HIDDEN) {
            this.hideActionTiming(action);
            return;
        }

        action.timingTrack.setVisible(true);
        action.timingDividers.forEach((divider) => divider.setVisible(true));

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.EXPIRED) {
            this.showExpiredActionTiming(action);
            return;
        }

        const stripWidth = action.background.displayWidth;
        const earlyWidth = Math.round(stripWidth * timing.earlyWidth01);
        const validWidth = stripWidth - earlyWidth;
        const stripX = action.background.x;
        const stripY = TILE.height - TIMING_STRIP.height;

        action.timingFill
            .setVisible(true)
            .setPosition(stripX + stripWidth, stripY)
            .setSize(validWidth, TIMING_STRIP.height)
            .setDisplaySize(validWidth, TIMING_STRIP.height);

        action.timingExpired.setVisible(false);

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.TOO_EARLY) {
            const earlyFillWidth = Math.round(earlyWidth * timing.earlyFill01);

            action.timingFill.setScale(1, 1);

            action.timingEarly
                .setVisible(earlyFillWidth > 0)
                .setPosition(stripX + earlyWidth, stripY)
                .setSize(earlyFillWidth, TIMING_STRIP.height)
                .setDisplaySize(earlyFillWidth, TIMING_STRIP.height);

            return;
        }

        action.timingEarly.setVisible(false);
        action.timingFill.setScale(timing.validFill01, 1);
    }

    private showExpiredActionTiming(action: ActionButton): void {
        action.timingFill.setVisible(false);
        action.timingEarly.setVisible(false);

        const blinkOn = Math.floor(this.scene.time.now / TIMING_STRIP.blinkPeriodMs) % 2 === 0;

        action.timingExpired.setVisible(blinkOn);
    }

    private hideActionTiming(action: ActionButton): void {
        action.timingTrack.setVisible(false);
        action.timingFill.setVisible(false);
        action.timingEarly.setVisible(false);
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

    private handleEngineerPointerDown(): void {
        if (this.engineerTaskId) {
            this.callbacks.onCancelTask(this.engineerTaskId);
            return;
        }

        if (!this.shieldTargetingAvailable) {
            return;
        }

        this.callbacks.onOpenShieldTargeting();
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
