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
import BridgeEquipmentMetricView from "../../BridgeEquipmentMetricView";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";

const TILE = {
    horizontalPadding: 9,

    titleY: 3,

    statusY: 70,

    integrityPipSize: 6,
    integrityPipGap: 2,
} as const;

// EVADE execution remains outside this presentation-only tile for now.
// The tile only renders the installed Drive, its EVADE Power cost and integrity.
export default class BridgeDriveTileView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly titleText: Phaser.GameObjects.BitmapText;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly metricView: BridgeEquipmentMetricView;

    private readonly integrityRoot: Phaser.GameObjects.Container;

    private chromeColor: number = FONT_COLOR.PRIMARY;

    private integrityCurrent = 0;

    private integrityMax = 0;

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

        this.integrityRoot = this.scene.add.container(0, 0);

        this.root.add([
            this.titleText,
            this.icon,
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

    public setEvadePowerCost(cost: number): void {
        this.metricView.setValue(cost);
    }

    public setIntegrity(current: number, max: number): void {
        this.integrityCurrent = current;
        this.integrityMax = max;
        this.renderIntegrity();
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
