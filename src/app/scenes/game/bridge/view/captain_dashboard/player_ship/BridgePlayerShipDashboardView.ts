import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 36,
} as const;

// Левая половина captain dashboard.
//
// Пока содержит только новый полноразмерный header.
// Equipment grid и special column будут добавляться отдельными focused views.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    constructor(
        scene: BridgeScene,
        eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root = scene.add.container(0, 0);

        const headerWidth = this.width - HEADER.sidePadding * 2;

        this.headerView = new BridgePlayerShipHeaderView(scene, eventBus, headerWidth, HEADER.height);
        this.headerView.setPosition(HEADER.sidePadding, HEADER.y);

        this.root.add(this.headerView.getRoot());
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public getSize(): { width: number; height: number } {
        return {
            width: this.width,
            height: this.height,
        };
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.headerView.destroy();
        this.root.destroy(false);
    }
}
