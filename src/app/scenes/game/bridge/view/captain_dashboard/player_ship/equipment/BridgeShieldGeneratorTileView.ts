// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeShieldGeneratorTileView.ts
import {
    EQUIPMENT_SPRITE_ID,
    EQUIPMENT_SPRITES,
} from "../../../../../../../manifests/equipment";
import {
    MICRO_ICON_ID,
} from "../../../../../../../manifests/micro_icons";
import { FONT_COLOR, FONT_FAMILY, FONT_SIZE } from "../../../../../../../theme/font";
import type BridgeScene from "../../../../BridgeScene";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    statusY: 70,

    integrityPipSize: 6,
    integrityPipGap: 2,
} as const;

export const SHIELD_GENERATOR_PROGRESS_MODE = {
    COOLDOWN: "cooldown",
    REPAIR: "repair",
    DEPLOYMENT: "deployment",
} as const;

export type ShieldGeneratorProgressMode =
    (typeof SHIELD_GENERATOR_PROGRESS_MODE)[keyof typeof SHIELD_GENERATOR_PROGRESS_MODE];

// Target selection stays outside this presentation-only tile for now.
// The tile only renders the installed Shield Generator state.
export default class BridgeShieldGeneratorTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly baseIcon: Phaser.GameObjects.Image;

    private readonly progressIcon: Phaser.GameObjects.Image;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private integrityCurrent = 0;

    private integrityMax = 0;

    private progressVisible = false;

    constructor(
        private readonly scene: BridgeScene,
        private readonly width: number,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.titleText = this.scene.add
            .bitmapText(
                TILE.horizontalPadding,
                TILE.titleY,
                FONT_FAMILY.UI_PRIMARY,
                "",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0)
            .setTint(this.chromeColor);

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.SHIELD_GENERATOR];
        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;

        this.baseIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

        this.progressIcon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor)
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

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([
            this.titleText,
            this.baseIcon,
            this.progressIcon,
            this.metricView.getRoot(),
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
        this.metricView.setValue(cost);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityCurrent = current;
        this.integrityMax = max;
        this.renderIntegrity();
    }

    public setProgress(mode: ShieldGeneratorProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case SHIELD_GENERATOR_PROGRESS_MODE.COOLDOWN:
                this.baseIcon.setTint(colors.cooldownColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.cooldownColor);
                break;

            case SHIELD_GENERATOR_PROGRESS_MODE.REPAIR:
                this.baseIcon.setTint(colors.repairColor);
                this.progressIcon.setTint(colors.readyColor);
                this.setChromeColor(colors.repairColor);
                break;

            case SHIELD_GENERATOR_PROGRESS_MODE.DEPLOYMENT:
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

    public setBroken(): void {
        const brokenColor = CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor;

        this.baseIcon.setTint(brokenColor);
        this.progressVisible = false;
        this.progressIcon.setVisible(false);
        this.setChromeColor(brokenColor);
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
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.metricView.setTextColor(color);
        this.renderIntegrity();
    }

    private renderIntegrity(): void {
        this.integrityRoot.removeAll(true);

        if (this.integrityMax <= 0) {
            return;
        }

        const totalWidth =
            this.integrityMax * TILE.integrityPipSize +
            (this.integrityMax - 1) * TILE.integrityPipGap;
        const startX = this.width - TILE.horizontalPadding - totalWidth;
        const integrityColor =
            this.integrityCurrent <= 0
                ? CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor
                : CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor;
        const emptyAlpha = CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.emptyAlpha;

        for (let index = 0; index < this.integrityMax; index += 1) {
            const filled = index < this.integrityCurrent;
            const x = startX + index * (TILE.integrityPipSize + TILE.integrityPipGap);

            const pip = this.scene.add
                .rectangle(
                    x,
                    TILE.statusY + 2,
                    TILE.integrityPipSize,
                    TILE.integrityPipSize,
                    integrityColor,
                    filled ? 1 : emptyAlpha,
                )
                .setOrigin(0, 0);

            this.integrityRoot.add(pip);
        }
    }
}
