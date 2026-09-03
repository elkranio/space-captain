import type BridgeScene from "../../BridgeScene";

export type BridgePipStripGeometry = {
    width: number;
    height: number;
    gap: number;
};

export const HEADER_STATUS_PIP: BridgePipStripGeometry = {
    width: 8,
    height: 14,
    gap: 3,
};

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

    private current = 0;

    private max = 0;

    private partialProgress: number | undefined;

    constructor(
        private readonly scene: BridgeScene,
        private palette: BridgePipStripPalette,
        private readonly geometry: BridgePipStripGeometry = HEADER_STATUS_PIP,
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
            this.pips.length * this.geometry.width +
            (this.pips.length - 1) * this.geometry.gap
        );
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setPalette(palette: BridgePipStripPalette): void {
        this.palette = palette;
        this.render();
    }

    public setValue(
        current: number,
        max: number,
        partialProgress?: number,
    ): void {
        if (!Number.isInteger(max) || max < 0) {
            throw new Error("Pip strip max must be a non-negative integer: " + max);
        }

        this.current = current;
        this.max = max;
        this.partialProgress = partialProgress;
        this.render();
    }

    public clear(): void {
        this.current = 0;
        this.max = 0;
        this.partialProgress = undefined;
        this.destroyPips();
    }

    public destroy(): void {
        this.clear();
        this.root.destroy(true);
    }

    private render(): void {
        this.reconcilePips(this.max);

        const clampedCurrent = Phaser.Math.Clamp(
            Math.floor(this.current),
            0,
            this.pips.length,
        );
        const clampedPartial = Phaser.Math.Clamp(this.partialProgress ?? 0, 0, 1);

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
                this.partialProgress !== undefined;

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

    private reconcilePips(max: number): void {
        if (this.pips.length === max) {
            return;
        }

        this.destroyPips();

        for (let index = 0; index < max; index += 1) {
            const x =
                index *
                (this.geometry.width + this.geometry.gap);

            const frame = this.scene.add
                .rectangle(
                    x,
                    0,
                    this.geometry.width,
                    this.geometry.height,
                    this.palette.emptyColor,
                    this.palette.emptyAlpha,
                )
                .setOrigin(0, 0);

            const fill = this.scene.add
                .rectangle(
                    x,
                    this.geometry.height,
                    this.geometry.width,
                    this.geometry.height,
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
