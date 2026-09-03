// src/app/scenes/game/bridge/view/captain_dashboard/BridgeEquipmentMetricView.ts
import { MICRO_ICONS, type MicroIconId } from "../../../../../manifests/micro_icons";
import { FONT_FAMILY, FONT_SIZE } from "../../../../../theme/font";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

const METRIC = {
    iconCellWidth: 14,
    textGap: 5,
    textOffsetY: -4,
} as const;

// Dumb "micro icon + value" row for equipment tiles.
// The icon is right-aligned inside a fixed logical cell so different icon
// silhouettes do not change the visual gap before the value.
export default class BridgeEquipmentMetricView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly valueText: Phaser.GameObjects.BitmapText;

    constructor(scene: BridgeScene, iconId: MicroIconId) {
        this.root = scene.add.container(0, 0);

        const sprite = MICRO_ICONS[iconId];

        const icon = scene.add
            .image(METRIC.iconCellWidth, 0, sprite.atlasKey, sprite.frameKey)
            .setOrigin(1, 0)
            .setTint(CAPTAIN_DASHBOARD_STYLE.equipmentAccent.iconColor);

        this.valueText = scene.add
            .bitmapText(
                METRIC.iconCellWidth + METRIC.textGap,
                METRIC.textOffsetY,
                FONT_FAMILY.UI_PRIMARY,
                "0",
                FONT_SIZE.PX_20,
            )
            .setOrigin(0, 0);

        this.root.add([icon, this.valueText]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setValue(value: number): void {
        this.valueText.setText(`${value}`);
    }

    public setTextColor(color: number): void {
        this.valueText.setTint(color);
    }
}
