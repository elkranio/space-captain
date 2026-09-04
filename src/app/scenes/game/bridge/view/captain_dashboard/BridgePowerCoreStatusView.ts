import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgePipStripView, {
    HEADER_STATUS_PIP,
} from "./BridgePipStripView";

const POWER_CORE = {
    iconGap: 8,
} as const;

// Shared Power Core presentation for both captain dashboards.
export default class BridgePowerCoreStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly pipStrip: BridgePipStripView;

    constructor(
        private readonly scene: BridgeScene,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const iconAsset =
            CAPTAIN_DASHBOARD_SPRITES[
                CAPTAIN_DASHBOARD_SPRITE_ID.POWER_CORE_ICON
            ];

        this.icon = this.scene.add
            .image(0, height / 2, iconAsset.atlasKey, iconAsset.frameKey)
            .setOrigin(0, 0.5);

        this.pipStrip = new BridgePipStripView(this.scene, {
            filledColor: CAPTAIN_DASHBOARD_STYLE.powerCore.chargeColor,
            emptyColor: CAPTAIN_DASHBOARD_STYLE.powerCore.chargeColor,
            emptyAlpha: CAPTAIN_DASHBOARD_STYLE.powerCore.emptyAlpha,
            partialColor: CAPTAIN_DASHBOARD_STYLE.powerCore.rechargeColor,
        });
        this.pipStrip.setPosition(
            this.icon.width + POWER_CORE.iconGap,
            Math.round((height - HEADER_STATUS_PIP.height) / 2),
        );

        this.root.add([
            this.icon,
            this.pipStrip.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setVisible(visible: boolean): void {
        this.root.setVisible(visible);
    }

    public update(
        current: number,
        max: number,
        rechargeProgress?: number,
    ): void {
        this.pipStrip.setValue(current, max, rechargeProgress);
    }

    public clear(): void {
        this.pipStrip.clear();
    }

    public destroy(): void {
        this.pipStrip.destroy();
        this.root.destroy(true);
    }
}
