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
    width: 153,
    height: 62,

    iconX: 9,
    iconY: 8,

    statusCenterX: 76,
    statusY: 8,

    timerX: 144,
    timerY: 8,

    actionY: 32,
    actionDividerX: 76,

    scienceActionX: 0,
    scienceActionWidth: 76,

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

    activeActionBackgroundColor: 0x3a2918,
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
    onIdentify: (command: BridgeOfficerCommandSelectedPayload) => void;
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

// Первый flat threat tile для нового captain display.
//
// Пока меняем только Missile, чтобы отдельно подобрать геометрию и цвета.
// Остальные threat types временно остаются на старом tile renderer.
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

        const missileIcon = this.createSprite(UI_COMBAT_SPRITE_ID.THREAT_MISSILE, TILE.iconX, TILE.iconY);

        this.identificationText = this.scene.add
            .bitmapText(TILE.statusCenterX, TILE.statusY, FONT_FAMILY.VGA_8X14, "NO ID", FONT_SIZE.PX_14)
            .setOrigin(0.5, 0)
            .setTint(FONT_COLOR.DANGER);

        this.timerText = this.scene.add
            .bitmapText(TILE.timerX, TILE.timerY, FONT_FAMILY.VGA_8X14, "--.-s", FONT_SIZE.PX_14)
            .setOrigin(1, 0)
            .setTint(FONT_COLOR.WHITE);

        this.scienceAction = this.createActionButton(
            TILE.scienceActionX,
            TILE.scienceActionWidth,
            UI_COMBAT_SPRITE_ID.ROLE_S,
            "TRACK",
        );

        this.weaponsAction = this.createActionButton(
            TILE.weaponsActionX,
            TILE.weaponsActionWidth,
            UI_COMBAT_SPRITE_ID.ROLE_W,
            "HIT",
        );

        this.scienceAction.background.on("pointerdown", this.handleSciencePointerDown, this);
        this.weaponsAction.background.on("pointerdown", this.handleWeaponsPointerDown, this);

        this.root.add([
            background,
            this.scienceAction.background,
            this.weaponsAction.background,
            missileIcon,
            this.identificationText,
            this.timerText,
            this.scienceAction.roleGlyph,
            this.scienceAction.label,
            this.scienceAction.timingTrack,
            this.scienceAction.timingFill,
            this.scienceAction.timingExpired,
            this.weaponsAction.roleGlyph,
            this.weaponsAction.label,
            this.weaponsAction.timingTrack,
            this.weaponsAction.timingFill,
            this.weaponsAction.timingExpired,
            ...this.scienceAction.timingDividers,
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
        );

        this.updateActionTiming(
            this.weaponsAction,
            missile.timeToImpactMs,
            missile.initialTimeToImpactMs,
            missile.decisionTimings?.interceptMissileMinRemainingMs,
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
