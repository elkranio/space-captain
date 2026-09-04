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

const COMPACT_HULL_PIP = {
    width: HEADER_STATUS_PIP.width,
    height: 6,
    gap: HEADER_STATUS_PIP.gap,
} as const;

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

    private readonly singlePipStrip: BridgePipStripView;

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

        this.singlePipStrip = new BridgePipStripView(this.scene, palette);
        this.topPipStrip = new BridgePipStripView(this.scene, palette, COMPACT_HULL_PIP);
        this.bottomPipStrip = new BridgePipStripView(this.scene, palette, COMPACT_HULL_PIP);

        this.root.add([
            this.icon,
            this.singlePipStrip.getRoot(),
            this.topPipStrip.getRoot(),
            this.bottomPipStrip.getRoot(),
        ]);

        this.layoutSingleRow();
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getWidth(): number {
        const pipWidth = Math.max(
            this.singlePipStrip.getWidth(),
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

        if (max <= HULL.maxPipsPerRow) {
            this.topPipStrip.clear();
            this.bottomPipStrip.clear();
            this.singlePipStrip.setValue(current, max);
            this.layoutSingleRow();
            return;
        }

        this.singlePipStrip.clear();

        const bottomMax = HULL.maxPipsPerRow;
        const topMax = max - bottomMax;
        const bottomCurrent = Math.min(current, bottomMax);
        const topCurrent = Math.max(0, current - bottomMax);

        this.bottomPipStrip.setValue(bottomCurrent, bottomMax);
        this.topPipStrip.setValue(topCurrent, topMax);
        this.layoutCompactRows();
    }

    public clear(): void {
        this.singlePipStrip.clear();
        this.topPipStrip.clear();
        this.bottomPipStrip.clear();
        this.layoutSingleRow();
    }

    public destroy(): void {
        this.singlePipStrip.destroy();
        this.topPipStrip.destroy();
        this.bottomPipStrip.destroy();
        this.root.destroy(true);
    }

    private layoutSingleRow(): void {
        this.singlePipStrip.setPosition(
            this.icon.width + HULL.iconGap,
            Math.round((this.height - HEADER_STATUS_PIP.height) / 2),
        );
    }

    private layoutCompactRows(): void {
        const x = this.icon.width + HULL.iconGap;
        const rowsHeight = COMPACT_HULL_PIP.height * 2 + HULL.rowGap;
        const topY = Math.round((this.height - rowsHeight) / 2);

        this.topPipStrip.setPosition(x, topY);
        this.bottomPipStrip.setPosition(
            x,
            topY + COMPACT_HULL_PIP.height + HULL.rowGap,
        );
    }
}
