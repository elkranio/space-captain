import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../BridgeScene";
import { CAPTAIN_DASHBOARD_STYLE } from "./captain_dashboard_style";

const HULL = {
    iconGap: 8,

    segmentWidth: 11,
    segmentHeight: 18,
    segmentGap: 5,
    segmentInset: 2,
} as const;

type HullSegmentView = {
    frame: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
};

// Shared HULL strip for both captain dashboards.
// One visible segment is one real Hull HP. The whole root can become a target hit area later.
export default class BridgeHullStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly icon: Phaser.GameObjects.Image;

    private readonly segments: HullSegmentView[] = [];

    private readonly segmentY: number;

    constructor(
        private readonly scene: BridgeScene,
        height: number,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.segmentY = Math.round((height - HULL.segmentHeight) / 2);

        const iconAsset = CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.HULL_ICON];

        this.icon = this.scene.add
            .image(0, height / 2, iconAsset.atlasKey, iconAsset.frameKey)
            .setOrigin(0, 0.5);

        this.root.add(this.icon);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public update(current: number, max: number): void {
        this.reconcileSegments(max);

        const clampedCurrent = Phaser.Math.Clamp(
            Math.floor(current),
            0,
            this.segments.length,
        );

        for (let index = 0; index < this.segments.length; index += 1) {
            const segment = this.segments[index];

            if (!segment) {
                continue;
            }

            segment.fill.setVisible(index < clampedCurrent);
        }
    }

    public clear(): void {
        this.destroySegments();
    }

    public destroy(): void {
        this.destroySegments();
        this.root.destroy(true);
    }

    private reconcileSegments(max: number): void {
        if (!Number.isInteger(max) || max < 0) {
            throw new Error("HULL max must be a non-negative integer: " + max);
        }

        if (this.segments.length === max) {
            return;
        }

        this.destroySegments();

        const segmentsX = this.icon.width + HULL.iconGap;

        for (let index = 0; index < max; index += 1) {
            const x = segmentsX + index * (HULL.segmentWidth + HULL.segmentGap);

            const frame = this.scene.add
                .rectangle(
                    x,
                    this.segmentY,
                    HULL.segmentWidth,
                    HULL.segmentHeight,
                    0x000000,
                    0,
                )
                .setOrigin(0, 0)
                .setStrokeStyle(
                    1,
                    CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.borderColor,
                );

            const fill = this.scene.add
                .rectangle(
                    x + HULL.segmentInset,
                    this.segmentY + HULL.segmentInset,
                    HULL.segmentWidth - HULL.segmentInset * 2,
                    HULL.segmentHeight - HULL.segmentInset * 2,
                    CAPTAIN_DASHBOARD_STYLE.equipmentIntegrity.filledColor,
                    1,
                )
                .setOrigin(0, 0)
                .setVisible(false);

            this.segments.push({ frame, fill });
            this.root.add([frame, fill]);
        }
    }

    private destroySegments(): void {
        for (const segment of this.segments) {
            segment.fill.destroy();
            segment.frame.destroy();
        }

        this.segments.length = 0;
    }
}
