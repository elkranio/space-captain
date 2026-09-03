// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/equipment/BridgeDriveTileView.ts
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
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    statusY: 70,

} as const;

// EVADE execution remains outside this presentation-only tile for now.
// The tile only renders the installed Drive, its EVADE Power cost and integrity.
export default class BridgeDriveTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly icon: Phaser.GameObjects.Image;

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

        const sprite = EQUIPMENT_SPRITES[EQUIPMENT_SPRITE_ID.DRIVE];
        const centerX = Math.round(this.width / 2);
        const centerY = Math.round(height / 2) + 1;

        this.icon = this.scene.add
            .image(centerX, centerY, sprite.atlasKey, sprite.frameKey)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);

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
        this.integrityView.setPosition(0, TILE.statusY + 2);
        this.integrityView.setRightEdge(this.width - TILE.horizontalPadding);

        this.root.add([
            this.titleText,
            this.icon,
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

    public setEvadePowerCost(cost: number): void {
        this.metricView.setValue(cost);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityView.update(current, max);
    }

    public setBroken(): void {
        this.setStateColor(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.repairColor);
    }

    public setResourceBlocked(): void {
        this.setStateColor(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.cooldownColor);
    }

    public resetState(): void {
        this.icon.setTint(CAPTAIN_DASHBOARD_STYLE.equipmentProgress.readyColor);
        this.setChromeColor(FONT_COLOR.PRIMARY);
    }

    public destroy(): void {
        this.root.destroy(true);
    }

    private setStateColor(color: number): void {
        this.icon.setTint(color);
        this.setChromeColor(color);
    }

    private setChromeColor(color: number): void {
        this.chromeColor = color;
        this.titleText.setTint(color);
        this.metricView.setTextColor(color);
    }
}
