// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeDefenseTurretTileView.ts
import { EQUIPMENT_SPRITE_ID, EQUIPMENT_SPRITES } from "../../../../../../../manifests/equipment";
import { MICRO_ICON_ID, MICRO_ICONS } from "../../../../../../../manifests/micro_icons";
import { EQUIPMENT_COLOR } from "../../../../../../../theme/equipment";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    targetIndicatorRight: 8,
    targetIndicatorY: 8,
    targetPulseAlpha: 0.65,
    targetPulseDurationMs: 700,

    statusY: 70,

    powerIconSize: 16,
    powerIconOffsetY: 0,
    powerTextOffsetY: -4,
    powerTextGap: -2,

    integrityPipSize: 8,
    integrityPipGap: 3,
} as const;

export const DEFENSE_TURRET_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    INTERCEPT: "intercept",
} as const;

export type DefenseTurretProgressMode =
    (typeof DEFENSE_TURRET_PROGRESS_MODE)[keyof typeof DEFENSE_TURRET_PROGRESS_MODE];

// The incoming-missile row owns HIT / CANCEL because it owns the exact threat.
// This tile presents only the installed Defense Turret state.
export default class BridgeDefenseTurretTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    private readonly targetIndicator: Phaser.GameObjects.Image;

    private readonly powerIcon: Phaser.GameObjects.Image;

    private readonly powerText: Phaser.GameObjects.BitmapText;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private integrityCurrent = 0;

    private integrityMax = 0;

    private progressVisible = false;

    private targetsAvailable = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.UI_PRIMARY, "", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.DEFENSE_TURRET];
        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;

        this.baseIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
            .setVisible(false);

        const targetSprite = MICRO_ICONS[MICRO_ICON_ID.DEFENSE_TURRET_TARGET_AVAILABLE];

        this.targetIndicator = this.scene.add
            .image(
                this.width - TILE.targetIndicatorRight,
                TILE.targetIndicatorY,
                targetSprite.atlasKey,
                targetSprite.frameKey,
            )
            .setOrigin(1, 0)
            .setTint(EQUIPMENT_COLOR.TARGET_AVAILABLE)
            .setVisible(false);

        const powerSprite = MICRO_ICONS[MICRO_ICON_ID.POWER_CHARGE];

        this.powerIcon = this.scene.add
            .image(
                TILE.horizontalPadding,
                TILE.statusY + TILE.powerIconOffsetY,
                powerSprite.atlasKey,
                powerSprite.frameKey,
            )
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        this.powerText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding + TILE.powerIconSize + TILE.powerTextGap,
                TILE.statusY + TILE.powerTextOffsetY,
                FONT_FAMILY.UI_PRIMARY,
                "0",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([
            this.titleText,
            this.baseIcon,
            this.progressIcon,
            this.targetIndicator,
            this.powerIcon,
            this.powerText,
            this.integrityRoot,
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setTitle(title: string): void {
        this.titleText.setText(title);
    }

    public setPowerCost(cost: number): void {
        this.powerText.setText(`${cost}`);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityCurrent = current;
        this.integrityMax = max;
        this.renderIntegrity();
    }

    public setTargetsAvailable(available: boolean): void {
        if (this.targetsAvailable === available) {
            return;
        }

        this.targetsAvailable = available;
        this.scene.tweens.killTweensOf(this.targetIndicator);
        this.targetIndicator.setVisible(available).setAlpha(1);

        if (!available) {
            return;
        }

        this.scene.tweens.add({
            targets: this.targetIndicator,
            alpha: TILE.targetPulseAlpha,
            duration: TILE.targetPulseDurationMs,
            ease: "Sine.InOut",
            yoyo: true,
            repeat: -1,
        });
    }

    public setProgress(mode: DefenseTurretProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case DEFENSE_TURRET_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTint(colors.cooldownColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.cooldownColor);
                break;

            case DEFENSE_TURRET_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTint(colors.repairColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.repairColor);
                break;

            case DEFENSE_TURRET_PROGRESS_MODE.INTERCEPT:
                this.baseIcon.setTint(colors.readyColor);
                this.progressIcon.setTint(colors.activityColor);
                this.setChromeColor(FONT_COLOR.PRIMARY);
                break;
        }

        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const cropWidth = Math.round(this.progressIcon.width * clampedProgress);

        this.progressVisible = cropWidth > 0;

        if (this.progressVisible) {
            this.progressIcon.setCrop(0, 0, cropWidth, this.progressIcon.height);
        }

        this.progressIcon.setVisible(this.progressVisible);
    }

    public setResourceBlocked(): void {
        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.baseIcon.setTint(blockedColor);
        this.progressVisible = false;
        this.progressIcon.setVisible(false);
        this.setChromeColor(blockedColor);
    }

    public resetProgress(): void {
        this.baseIcon.setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);
        this.progressVisible = false;
        this.progressIcon.setVisible(false);
        this.setChromeColor(FONT_COLOR.PRIMARY);
    }

    public destroy(): void {
        this.scene.tweens.killTweensOf(this.targetIndicator);
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.powerText.setTint(color);
        this.powerIcon.setTint(color);
        this.renderIntegrity();
    }

    private renderIntegrity(): void {
        this.integrityRoot.removeAll(true);

        if (this.integrityMax <= 0) {
            return;
        }

        const totalWidth = this.integrityMax * TILE.integrityPipSize + (this.integrityMax - 1) * TILE.integrityPipGap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const emptyColor = 0x0b1621;

        for (let index = 0; index < this.integrityMax; index += 1) {
            const filled = index < this.integrityCurrent;
            const x = startX + index * (TILE.integrityPipSize + TILE.integrityPipGap);

            const pip = this.scene.add
                .rectangle(
                    x,
                    TILE.statusY + 2,
                    TILE.integrityPipSize,
                    TILE.integrityPipSize,
                    filled ? this.chromeColor : emptyColor,
                    1,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(1, this.chromeColor);

            this.integrityRoot.add(pip);
        }
    }
}
