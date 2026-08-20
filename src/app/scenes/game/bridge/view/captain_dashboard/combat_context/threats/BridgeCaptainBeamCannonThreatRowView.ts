// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainBeamCannonThreatRowView.ts
import { BEAM_CANNON_TARGET_INTEL_STATUS } from "../../../../../../../../engine/encounter/model/combat";
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingBeamCannonPayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";
import {
    BEAM_SHIELD_TIMING_PHASE,
    getBeamShieldTimingStripState,
} from "./get_beam_shield_timing_strip_state";

const TILE = {
    width: 163,
    height: 66,

    iconX: 9,
    iconY: 8,

    statusCenterX: 81,
    statusY: 8,

    timerX: 154,
    timerY: 8,

    buttonWidth: 75,
    buttonY: 34,
    scienceButtonX: 5,
    engineerButtonX: 83,

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

type BeamShieldWindow = NonNullable<BridgeCaptainIncomingBeamCannonPayload["decisionTimings"]>["shieldWindow"];

type BeamCannonThreatRowCallbacks = {
    onTrack: (command: BridgeOfficerCommandSelectedPayload) => void;
    onDeployShield: (command: BridgeOfficerCommandSelectedPayload) => void;
    onCancelTask: (taskId: string) => void;
};

type ActionButton = {
    background: Phaser.GameObjects.Image;
    roleGlyph: Phaser.GameObjects.Image;
    label: Phaser.GameObjects.Text;

    timingTrack: Phaser.GameObjects.Rectangle;
    timingFill: Phaser.GameObjects.Rectangle;
    timingEarly: Phaser.GameObjects.Rectangle;
    timingExpired: Phaser.GameObjects.Rectangle;
};

// Beam Cannon использует тот же production-like tile grammar, что и missile.
// Objective target остаётся скрытым в engine; view рисует только player-observer intel.
export default class BridgeCaptainBeamCannonThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly targetText: Phaser.GameObjects.BitmapText;

    private readonly scienceAction: ActionButton;
    private readonly engineerAction: ActionButton;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private engineerCommand?: BridgeOfficerCommandSelectedPayload;

    private scienceTaskId?: string;
    private engineerTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: BeamCannonThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const beamCannonIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_BEAM_CANNON, TILE.iconX, TILE.iconY);

        this.targetText = this.scene.add
            .bitmapText(TILE.statusCenterX, TILE.statusY, FONT_FAMILY.VGA_8X14, "UNKNOWN", FONT_SIZE.PX_14)
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.DANGER);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(TILE.scienceButtonX, UI_COMBAT_SPRITE_ID.ROLE_S, "TRACK");

        this.engineerAction = this.createActionButton(TILE.engineerButtonX, UI_COMBAT_SPRITE_ID.ROLE_E, "SHIELD");

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);
        this.engineerAction.background.on("pointerdown", this.handleEngineerPointerDown, this);

        this.root.add([
            background,
            beamCannonIcon,
            this.targetText,
            this.timerText,
            this.scienceAction.background,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            this.scienceAction.timingTrack,
            this.scienceAction.timingFill,
            this.scienceAction.timingEarly,
            this.scienceAction.timingExpired,
            this.engineerAction.background,
            this.engineerAction.roleGlyph,
            this.engineerAction.label,
            this.engineerAction.timingTrack,
            this.engineerAction.timingFill,
            this.engineerAction.timingEarly,
            this.engineerAction.timingExpired,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(beamCannon: BridgeCaptainIncomingBeamCannonPayload): void {
        this.timerText.setText(formatCaptainDashboardCountdown(beamCannon.timeToFireMs));

        this.updateTargetIntel(beamCannon.targetIntel);

        const trackTargetTaskId = beamCannon.activeTasks?.trackTargetTaskId;

        if (beamCannon.targetIntel.status === BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED && !trackTargetTaskId) {
            this.hideScienceAction();
        } else {
            this.setScienceAction(beamCannon.actions.trackTarget, trackTargetTaskId);
        }

        const deployShieldTaskId = beamCannon.activeTasks?.deployShieldTaskId;

        this.setEngineerAction(beamCannon.actions.deployShield, deployShieldTaskId);

        this.updateTrackTiming(
            beamCannon.timeToFireMs,
            beamCannon.initialTimeToFireMs,
            beamCannon.decisionTimings?.trackTargetMinRemainingMs,
            trackTargetTaskId !== undefined,
        );

        this.updateShieldTiming(
            beamCannon.timeToFireMs,
            beamCannon.initialTimeToFireMs,
            beamCannon.decisionTimings?.shieldWindow,
            deployShieldTaskId !== undefined,
        );
    }

    public destroy(): void {
        this.scienceAction.background.off("pointerdown", this.handleSciencePointerDown, this);
        this.engineerAction.background.off("pointerdown", this.handleEngineerPointerDown, this);

        this.scienceCommand = undefined;
        this.engineerCommand = undefined;

        this.scienceTaskId = undefined;
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

        const timingEarly = this.scene.add
            .rectangle(
                timingX,
                timingY,
                TIMING_STRIP.width,
                TIMING_STRIP.height,
                FONT_COLOR.DANGER,
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
            timingEarly,
            timingExpired,
        };
    }

    private updateTargetIntel(targetIntel: BridgeCaptainIncomingBeamCannonPayload["targetIntel"]): void {
        switch (targetIntel.status) {
            case BEAM_CANNON_TARGET_INTEL_STATUS.UNKNOWN:
                this.targetText.setText("UNKNOWN").setTint(FONT_COLOR.DANGER);
                return;

            case BEAM_CANNON_TARGET_INTEL_STATUS.UNCERTAIN:
                this.targetText.setText(`${targetIntel.hypothesis.toUpperCase()}?`).setTint(FONT_COLOR.ACTIVITY);
                return;

            case BEAM_CANNON_TARGET_INTEL_STATUS.CONFIRMED:
                this.targetText.setText(targetIntel.hypothesis.toUpperCase()).setTint(FONT_COLOR.SECONDARY);
                return;
        }
    }

    private setScienceAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.setActionVisible(this.scienceAction, true);

        this.scienceCommand = command;
        this.scienceTaskId = taskId;
        this.setActionState(this.scienceAction, command !== undefined, taskId !== undefined);
    }

    private hideScienceAction(): void {
        this.scienceCommand = undefined;
        this.scienceTaskId = undefined;

        this.scienceAction.background.disableInteractive();
        this.setActionVisible(this.scienceAction, false);
    }

    private setEngineerAction(
        command: BridgeOfficerCommandSelectedPayload | undefined,
        taskId: string | undefined,
    ): void {
        this.setActionVisible(this.engineerAction, true);

        this.engineerCommand = command;
        this.engineerTaskId = taskId;
        this.setActionState(this.engineerAction, command !== undefined, taskId !== undefined);
    }

    private setActionVisible(action: ActionButton, visible: boolean): void {
        action.background.setVisible(visible);
        action.roleGlyph.setVisible(visible);
        action.label.setVisible(visible);

        if (!visible) {
            this.hideActionTiming(action);
        }
    }

    private updateTrackTiming(
        remainingMs: number,
        initialRemainingMs: number,
        latestUsefulStartRemainingMs: number | null | undefined,
        actionIsActive: boolean,
    ): void {
        const action = this.scienceAction;

        if (!action.background.visible || actionIsActive || latestUsefulStartRemainingMs === undefined) {
            this.hideActionTiming(action);
            return;
        }

        action.timingTrack.setVisible(true);
        action.timingEarly.setVisible(false);

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

    private updateShieldTiming(
        remainingMs: number,
        initialRemainingMs: number,
        shieldWindow: BeamShieldWindow | undefined,
        actionIsActive: boolean,
    ): void {
        const action = this.engineerAction;

        if (!action.background.visible || actionIsActive) {
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

        if (timing.phase === BEAM_SHIELD_TIMING_PHASE.EXPIRED) {
            this.showExpiredActionTiming(action);
            return;
        }

        const earlyWidth = Math.round(TIMING_STRIP.width * timing.earlyWidth01);
        const validWidth = TIMING_STRIP.width - earlyWidth;
        const stripX = action.background.x + TIMING_STRIP.offsetX;
        const stripY = action.background.y + TIMING_STRIP.offsetY;

        action.timingFill
            .setVisible(true)
            .setPosition(stripX + TIMING_STRIP.width, stripY)
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
        action.timingExpired.setVisible(false);
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

        this.callbacks.onTrack(this.scienceCommand);
    }

    private handleEngineerPointerDown(): void {
        if (this.engineerTaskId) {
            this.callbacks.onCancelTask(this.engineerTaskId);
            return;
        }

        if (!this.engineerCommand) {
            return;
        }

        this.callbacks.onDeployShield(this.engineerCommand);
    }
}

type UiCombatSpriteId = (typeof UI_COMBAT_SPRITE_ID)[keyof typeof UI_COMBAT_SPRITE_ID];
