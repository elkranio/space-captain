// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeDefenseTurretTileView.ts
import { EQUIPMENT_SPRITE_ID, EQUIPMENT_SPRITES } from "../../../../../../../manifests/equipment";
import { MICRO_ICON_ID, MICRO_ICONS } from "../../../../../../../manifests/micro_icons";
import { EQUIPMENT_COLOR } from "../../../../../../../theme/equipment";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import { OFFICER_ROLE_COLOR } from "../../../../../../../theme/officer";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentHoverActionView from "../../BridgeEquipmentHoverActionView";
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    ...CAPTAIN_DASHBOARD_LAYOUT.equipmentTile,
    targetIndicatorRight: 8,
    targetIndicatorY: 8,
    targetPulseAlpha: 0.65,
    targetPulseDurationMs: 700,
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

    private readonly hoverView: BridgeEquipmentHoverActionView;

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly targetIndicator: Phaser.GameObjects.Image;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private readonly interactionHitArea: Phaser.GameObjects.Rectangle;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private targetsAvailable = false;

    private interactionEnabled = true;
    private selectionBlocked = false;

    private pointerOver = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
        onInteractionRequested: () => void,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.interactionHitArea = this.scene.add
            .rectangle(0, 0, this.width, height, 0xffffff, 0)
            .setOrigin(0, 0)
            .setInteractive({ useHandCursor: true });

        this.interactionHitArea
            .on(Phaser.Input.Events.POINTER_OVER, this.handlePointerOver, this)
            .on(Phaser.Input.Events.POINTER_OUT, this.handlePointerOut, this)
            .on("pointerup", onInteractionRequested);

        this.titleText = this.scene.add
            .bitmapText(TILE.horizontalPadding, TILE.titleY, FONT_FAMILY.UI_PRIMARY, "", FONT_SIZE.PX_20)
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.DEFENSE_TURRET];
        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + TILE.iconCenterOffsetY;

        this.progressIconView = new BridgeEquipmentProgressIconView(
            this.scene,
            sprite,
        );
        this.progressIconView.setPosition(centerX, centerY);

        const targetSprite =
            MICRO_ICONS[MICRO_ICON_ID.DEFENSE_TURRET_TARGET_AVAILABLE];

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

        this.metricView = new BridgeEquipmentMetricView(
            this.scene,
            MICRO_ICON_ID.POWER_CHARGE,
        );
        this.metricView.setPosition(
            TILE.horizontalPadding,
            TILE.statusY,
        );
        this.metricView.setTextColor(this.chromeColor);

        this.integrityView = new BridgeEquipmentIntegrityView(this.scene);
        this.integrityView.setPosition(
            0,
            TILE.statusY + TILE.integrityOffsetY,
        );
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.hoverView = new BridgeEquipmentHoverActionView(
            this.scene,
            this.width,
            height,
        );

        this.root.add([
            this.titleText,
            this.progressIconView.getRoot(),
            this.targetIndicator,
            this.metricView.getRoot(),
            this.integrityView.getRoot(),
            this.hoverView.getRoot(),
            this.interactionHitArea,
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
        this.metricView.setValue(cost);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setInteractionEnabled(enabled: boolean): void {
        if (this.interactionEnabled === enabled) {
            return;
        }

        this.interactionEnabled = enabled;

        this.syncInteraction();
    }

    public setSelectionBlocked(blocked: boolean): void {
        if (this.selectionBlocked === blocked) {
            return;
        }
        this.selectionBlocked = blocked;
        this.syncInteraction();
    }

    private syncInteraction(): void {

        if (this.interactionEnabled && !this.selectionBlocked) {
            this.interactionHitArea.setInteractive({ useHandCursor: true });
        } else {
            this.pointerOver = false;
            this.interactionHitArea.disableInteractive();
        }

        this.renderHover();
    }

    public setTargetsAvailable(available: boolean): void {
        if (this.targetsAvailable === available) {
            return;
        }

        this.targetsAvailable = available;
        this.scene.tweens.killTweensOf(this.targetIndicator);
        this.targetIndicator.setAlpha(1);

        if (available) {
            this.scene.tweens.add({
                targets: this.targetIndicator,
                alpha: TILE.targetPulseAlpha,
                duration: TILE.targetPulseDurationMs,
                ease: "Sine.InOut",
                yoyo: true,
                repeat: -1,
            });
        }

        this.renderHover();
    }

    public setProgress(mode: DefenseTurretProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case DEFENSE_TURRET_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setProgress(
                    colors.cooldownColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.cooldownColor);
                break;

            case DEFENSE_TURRET_PROGRESS_MODE.REPAIR:
                this.progressIconView.setProgress(
                    colors.repairColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.repairColor);
                break;

            case DEFENSE_TURRET_PROGRESS_MODE.INTERCEPT:
                this.progressIconView.setProgress(
                    colors.readyColor,
                    colors.activityColor,
                    progress,
                );
                this.setChromeColor(FONT_COLOR.PRIMARY);
                break;
        }
    }

    public setBroken(): void {
        const brokenColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor;

        this.progressIconView.setBaseColor(brokenColor);
        this.setChromeColor(brokenColor);
    }

    public setResourceBlocked(): void {
        const blockedColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor;

        this.progressIconView.setBaseColor(blockedColor);
        this.setChromeColor(blockedColor);
    }

    public resetProgress(): void {
        this.progressIconView.setBaseColor(
            CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor,
        );
        this.setChromeColor(FONT_COLOR.PRIMARY);
    }

    public destroy(): void {
        this.scene.tweens.killTweensOf(this.targetIndicator);
        this.root.destroy(true);
    }

    private renderHover(): void {
        const showAction = this.pointerOver && this.interactionEnabled && !this.selectionBlocked;

        this.titleText.setVisible(!showAction);
        this.targetIndicator.setVisible(this.targetsAvailable && !showAction);
        this.hoverView.setVisible(showAction);

        if (!showAction) {
            return;
        }

        this.hoverView.setAction(
            "G",
            OFFICER_ROLE_COLOR.gunner,
            "INTERCEPT",
        );
    }

    private handlePointerOver(): void {
        this.pointerOver = true;
        this.renderHover();
    }

    private handlePointerOut(): void {
        this.pointerOver = false;
        this.renderHover();
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.metricView.setTextColor(color);
    }
}
