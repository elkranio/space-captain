// src/app/scenes/game/bridge/view/captain_dashboard/combat_context/threats/BridgeCaptainMissileThreatRowView.ts
import { MISSILE_SIGNATURE_INTEL_STATUS } from "../../../../../../../../engine/encounter/model/missile_signature_intel";
import { UI_COMBAT_SPRITE_ID, UI_COMBAT_SPRITES } from "../../../../../../../manifests/ui/combat";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import type {
    BridgeCaptainIncomingMissilePayload,
    BridgeOfficerCommandSelectedPayload,
} from "../../../../events/bridge_event";
import { formatCaptainDashboardCountdown } from "../../captain_dashboard_format";

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
    weaponsButtonX: 83,

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

type MissileThreatRowCallbacks = {
    onIdentify: (command: BridgeOfficerCommandSelectedPayload) => void;
    onIntercept: (command: BridgeOfficerCommandSelectedPayload) => void;
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

// Первый production-like threat tile.
//
// Пока общий ThreatsView всё ещё раскладывает mixed threat types вертикально.
// В следующем layout-атоме этот fixed 163x66 tile станет ячейкой общей 3x2 сетки.
export default class BridgeCaptainMissileThreatRowView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly timerText: Phaser.GameObjects.BitmapText;
    private readonly identificationText: Phaser.GameObjects.BitmapText;

    private readonly scienceAction: ActionButton;
    private readonly weaponsAction: ActionButton;

    private scienceCommand?: BridgeOfficerCommandSelectedPayload;
    private weaponsCommand?: BridgeOfficerCommandSelectedPayload;

    private scienceTaskId?: string;
    private weaponsTaskId?: string;

    constructor(
        private readonly scene: BridgeScene,
        private readonly callbacks: MissileThreatRowCallbacks,
    ) {
        this.root = this.scene.add.container(0, 0);

        const background = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_TILE_BG, 0, 0);
        const missileIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_MISSILE, TILE.iconX, TILE.iconY);

        this.identificationText = this.scene.add
            .bitmapText(TILE.statusCenterX, TILE.statusY, FONT_FAMILY.VGA_8X14, "NO ID", FONT_SIZE.PX_14)
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.DANGER);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(TILE.scienceButtonX, UI_COMBAT_SPRITE_ID.ROLE_S, "TRACK");

        this.weaponsAction = this.createActionButton(TILE.weaponsButtonX, UI_COMBAT_SPRITE_ID.ROLE_W, "HIT");

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);
        this.weaponsAction.background.on("pointerdown", this.handleWeaponsPointerDown, this);

        this.root.add([
            background,
            missileIcon,
            this.identificationText,
            this.timerText,
            this.scienceAction.background,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            this.scienceAction.timingTrack,
            this.scienceAction.timingFill,
            this.scienceAction.timingExpired,
            this.weaponsAction.background,
            this.weaponsAction.roleGlyph,
            this.weaponsAction.label,
            this.weaponsAction.timingTrack,
            this.weaponsAction.timingFill,
            this.weaponsAction.timingExpired,
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

        this.updateIdentification(missile.identificationStatus);

        const identifyThreatTaskId = missile.activeTasks?.identifyThreatTaskId;

        if (missile.identificationStatus === MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED && !identifyThreatTaskId) {
            this.hideScienceAction();
        } else {
            this.setScienceAction(missile.actions.identifyThreat, identifyThreatTaskId);
        }

        const interceptMissileTaskId = missile.activeTasks?.interceptMissileTaskId;

        this.setWeaponsAction(missile.actions.interceptMissile, interceptMissileTaskId);

        this.updateActionTiming(
            this.scienceAction,
            missile.timeToImpactMs,
            missile.initialTimeToImpactMs,
            missile.decisionTimings?.identifyThreatMinRemainingMs,
            identifyThreatTaskId !== undefined,
        );

        this.updateActionTiming(
            this.weaponsAction,
            missile.timeToImpactMs,
            missile.initialTimeToImpactMs,
            missile.decisionTimings?.interceptMissileMinRemainingMs,
            interceptMissileTaskId !== undefined,
        );
    }

    public destroy(): void {
        this.scienceAction.background.off("pointerdown", this.handleSciencePointerDown, this);
        this.weaponsAction.background.off("pointerdown", this.handleWeaponsPointerDown, this);

        this.scienceCommand = undefined;
        this.weaponsCommand = undefined;

        this.scienceTaskId = undefined;
        this.weaponsTaskId = undefined;

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

    private updateIdentification(status: BridgeCaptainIncomingMissilePayload["identificationStatus"]): void {
        switch (status) {
            case MISSILE_SIGNATURE_INTEL_STATUS.UNKNOWN:
                this.identificationText.setText("NO ID").setTint(FONT_COLOR.DANGER);
                return;

            case MISSILE_SIGNATURE_INTEL_STATUS.UNCERTAIN:
                this.identificationText.setText("GUESS").setTint(FONT_COLOR.ACTIVITY);
                return;

            case MISSILE_SIGNATURE_INTEL_STATUS.CONFIRMED:
                this.identificationText.setText("LOCK").setTint(FONT_COLOR.SECONDARY);
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
        actionIsActive: boolean,
    ): void {
        if (!action.background.visible || actionIsActive || latestUsefulStartRemainingMs === undefined) {
            this.hideActionTiming(action);
            return;
        }

        action.timingTrack.setVisible(true);

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

        this.callbacks.onIdentify(this.scienceCommand);
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
