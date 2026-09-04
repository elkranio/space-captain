// src/app/scenes/game/bridge/view/captain_dashboard/BridgeHullStatusView.ts
import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";
import BridgePipStripView, {
    HEADER_STATUS_PIP,
} from "./BridgePipStripView";

const HULL = {
    iconGap: 8,
    maxPipsPerRow: 15,
    rowGap: 2,
} as const;

// Shared HULL strip for both captain dashboards.
// One visible pip is one real Hull HP. The whole root can become a target hit area later.
export default class BridgeHullStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly topPipStrip: BridgePipStripView;

    private readonly bottomPipStrip: BridgePipStripView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        const iconAsset =
            CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.HULL_ICON];

        this.icon = this.scene.add
            .image(0, height / 2, iconAsset.atlasKey, iconAsset.frameKey)
            .setOrigin(0, 0.5);

        const palette = {
            filledColor: CAPTAIN_DASHBOARD_STYLE.hull.filledColor,
            emptyColor: CAPTAIN_DASHBOARD_STYLE.hull.filledColor,
            emptyAlpha: CAPTAIN_DASHBOARD_STYLE.hull.emptyAlpha,
        };

        this.topPipStrip = new BridgePipStripView(this.scene, palette);
        this.bottomPipStrip = new BridgePipStripView(this.scene, palette);

        this.root.add([
            this.icon,
            this.topPipStrip.getRoot(),
            this.bottomPipStrip.getRoot(),
        ]);

        this.layoutRows(false);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getWidth(): number {
        const pipWidth = Math.max(
            this.topPipStrip.getWidth(),
            this.bottomPipStrip.getWidth(),
        );

        return this.icon.width + (pipWidth > 0 ? HULL.iconGap : 0) + pipWidth;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(current: number, max: number): void {
        if (max > HULL.maxPipsPerRow * 2) {
            throw new Error(
                "Hull status supports at most " + HULL.maxPipsPerRow * 2 + " HP: " + max,
            );
        }

        const twoRows = max > HULL.maxPipsPerRow;
        const topMax = twoRows ? Math.ceil(max / 2) : max;
        const bottomMax = twoRows ? Math.floor(max / 2) : 0;
        const topCurrent = Math.min(current, topMax);
        const bottomCurrent = Math.max(0, current - topMax);

        this.topPipStrip.setValue(topCurrent, topMax);
        this.bottomPipStrip.setValue(bottomCurrent, bottomMax);
        this.layoutRows(twoRows);
    }

    public clear(): void {
        this.topPipStrip.clear();
        this.bottomPipStrip.clear();
        this.layoutRows(false);
    }

    public destroy(): void {
        this.topPipStrip.destroy();
        this.bottomPipStrip.destroy();
        this.root.destroy(true);
    }

    private layoutRows(twoRows: boolean): void {
        const x = this.icon.width + HULL.iconGap;

        if (!twoRows) {
            this.topPipStrip.setPosition(
                x,
                Math.round((this.height - HEADER_STATUS_PIP.height) / 2),
            );
            this.bottomPipStrip.setPosition(x, 0);
            return;
        }

        const rowsHeight = HEADER_STATUS_PIP.height * 2 + HULL.rowGap;
        const topY = Math.round((this.height - rowsHeight) / 2);

        this.topPipStrip.setPosition(x, topY);
        this.bottomPipStrip.setPosition(
            x,
            topY + HEADER_STATUS_PIP.height + HULL.rowGap,
        );
    }
}
