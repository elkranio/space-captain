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
import BridgeEquipmentIntegrityView from "../../BridgeEquipmentIntegrityView";
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import BridgeEquipmentProgressIconView from "../../BridgeEquipmentProgressIconView";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../../captain_dashboard_layout";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = CAPTAIN_DASHBOARD_LAYOUT.equipmentTile;

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

    private readonly progressIconView: BridgeEquipmentProgressIconView;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityView: BridgeEquipmentIntegrityView;

    private chromeColor: number = FONT_COLOR.PRIMARY;

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
        const centerY = Math.round(height / 2) + TILE.iconCenterOffsetY;

        this.progressIconView = new BridgeEquipmentProgressIconView(
            this.scene,
            sprite,
        );
        this.progressIconView.setPosition(centerX, centerY);

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
        this.integrityView.setPosition(0, TILE.statusY + TILE.integrityOffsetY);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.root.add([
            this.titleText,
            this.progressIconView.getRoot(),
            this.metricView.getRoot(),
            this.integrityView.getRoot(),
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

    public setProgress(mode: ShieldGeneratorProgressMode, progress: number): void {
        const colors = CAPTAIN_DASHBOARD_STYLE.equipmentProgress;

        switch (mode) {
            case SHIELD_GENERATOR_PROGRESS_MODE.COOLDOWN:
                this.progressIconView.setProgress(
                    colors.cooldownColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.cooldownColor);
                break;

            case SHIELD_GENERATOR_PROGRESS_MODE.REPAIR:
                this.progressIconView.setProgress(
                    colors.repairColor,
                    colors.readyColor,
                    progress,
                );
                this.setChromeColor(colors.repairColor);
                break;

            case SHIELD_GENERATOR_PROGRESS_MODE.DEPLOYMENT:
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
        this.root.destroy(true);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.metricView.setTextColor(color);
    }
}
