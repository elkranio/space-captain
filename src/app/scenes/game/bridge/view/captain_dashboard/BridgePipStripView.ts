import type BridgeScene from "../../BridgeScene";

export const HEADER_STATUS_PIP = {
    width: 8,
    height: 14,
    gap: 3,
} as const;

export type BridgePipStripPalette = {
    filledColor: number;
    emptyColor: number;
    emptyAlpha: number;
    partialColor?: number;
};

type BridgePipView = {
    frame: Phaser.GameObjects.Rectangle;
    fill: Phaser.GameObjects.Rectangle;
};

// Dumb reusable segmented value view.
// Full = solid block, empty = muted block, optional partial = bottom-up fill.
export default class BridgePipStripView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly pips: BridgePipView[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly palette: BridgePipStripPalette,
    ) {
        this.root = this.scene.add.container(0, 0);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getWidth(): number {
        if (this.pips.length === 0) {
            return 0;
        }

        return (
            this.pips.length * HEADER_STATUS_PIP.width +
            (this.pips.length - 1) * HEADER_STATUS_PIP.gap
        );
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setValue(
        current: number,
        max: number,
        partialProgress?: number,
    ): void {
        this.reconcilePips(max);

        const clampedCurrent = Phaser.Math.Clamp(
            Math.floor(current),
            0,
            this.pips.length,
        );
        const clampedPartial = Phaser.Math.Clamp(partialProgress ?? 0, 0, 1);

        for (let index = 0; index < this.pips.length; index += 1) {
            const pip = this.pips[index];

            if (!pip) {
                continue;
            }

            if (index < clampedCurrent) {
                pip.frame.setVisible(false);
                pip.fill
                    .setVisible(true)
                    .setScale(1, 1)
                    .setFillStyle(this.palette.filledColor, 1);
                continue;
            }

            const isPartial =
                index === clampedCurrent &&
                clampedCurrent < this.pips.length &&
                partialProgress !== undefined;

            if (isPartial) {
                pip.frame.setVisible(true);
                pip.fill
                    .setVisible(true)
                    .setScale(1, clampedPartial)
                    .setFillStyle(
                        this.palette.partialColor ?? this.palette.filledColor,
                        1,
                    );
                continue;
            }

            pip.frame.setVisible(true);
            pip.fill.setVisible(false).setScale(1, 1);
        }
    }

    public clear(): void {
        this.destroyPips();
    }

    public destroy(): void {
        this.destroyPips();
        this.root.destroy(true);
    }

    private reconcilePips(max: number): void {
        if (!Number.isInteger(max) || max < 0) {
            throw new Error("Pip strip max must be a non-negative integer: " + max);
        }

        if (this.pips.length === max) {
            return;
        }

        this.destroyPips();

        for (let index = 0; index < max; index += 1) {
            const x =
                index *
                (HEADER_STATUS_PIP.width + HEADER_STATUS_PIP.gap);

            const frame = this.scene.add
                .rectangle(
                    x,
                    0,
                    HEADER_STATUS_PIP.width,
                    HEADER_STATUS_PIP.height,
                    this.palette.emptyColor,
                    this.palette.emptyAlpha,
                )
                .setOrigin(0, 0);

            const fill = this.scene.add
                .rectangle(
                    x,
                    HEADER_STATUS_PIP.height,
                    HEADER_STATUS_PIP.width,
                    HEADER_STATUS_PIP.height,
                    this.palette.filledColor,
                    1,
                )
                .setOrigin(0, 1)
                .setVisible(false);

            this.pips.push({ frame, fill });
            this.root.add([fill, frame]);
        }
    }

    private destroyPips(): void {
        for (const pip of this.pips) {
            pip.fill.destroy();
            pip.frame.destroy();
        }

        this.pips.length = 0;
    }
}
