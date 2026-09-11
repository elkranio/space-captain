import type BridgeScene from "../../BridgeScene";

export const BRIDGE_EQUIPMENT_PROGRESS_DIRECTION = {
    INCREASING: "increasing",
    DECREASING: "decreasing",
} as const;

export type BridgeEquipmentProgressDirection =
    (typeof BRIDGE_EQUIPMENT_PROGRESS_DIRECTION)[keyof typeof BRIDGE_EQUIPMENT_PROGRESS_DIRECTION];

export interface BridgeEquipmentProgressPresentation {
    color: number;
    direction: BridgeEquipmentProgressDirection;
}

// Dumb equipment progress line.
// Gameplay semantics stay in the caller; this view only renders elapsed progress.
export default class BridgeEquipmentProgressBarView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly bar: Phaser.GameObjects.Rectangle;

    constructor(scene: BridgeScene, width: number, height: number) {
        this.root = scene.add.container(0, 0);
        this.bar = scene.add
            .rectangle(0, 0, width, height, 0xffffff)
            .setOrigin(0, 0)
            .setScale(0, 1)
            .setVisible(false);
        this.root.add(this.bar);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public setProgress(progress: number, presentation: BridgeEquipmentProgressPresentation): void {
        const clampedProgress = Phaser.Math.Clamp(progress, 0, 1);
        const displayedProgress =
            presentation.direction === BRIDGE_EQUIPMENT_PROGRESS_DIRECTION.DECREASING
                ? 1 - clampedProgress
                : clampedProgress;

        this.bar
            .setFillStyle(presentation.color, 1)
            .setScale(displayedProgress, 1)
            .setVisible(displayedProgress > 0);
    }

    public reset(): void {
        this.bar.setScale(0, 1).setVisible(false);
    }
}
