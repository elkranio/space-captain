import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgePlayerShipSystemsView from "./systems/BridgePlayerShipSystemsView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 40,
} as const;

const LEGACY_SYSTEMS = {
    width: 400,
    height: 144,
    y: 72,
} as const;

// Левая половина captain dashboard.
//
// Header уже собирается под новый полноразмерный dashboard.
// Legacy systems list пока оставлен ниже только до следующего прохода,
// где его заменит 4x3 equipment grid.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    private readonly systemsView: BridgePlayerShipSystemsView;

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

        this.systemsView = new BridgePlayerShipSystemsView(
            scene,
            eventBus,
            LEGACY_SYSTEMS.width,
            LEGACY_SYSTEMS.height,
        );

        this.systemsView.setPosition(
            Math.round((this.width - LEGACY_SYSTEMS.width) / 2),
            LEGACY_SYSTEMS.y,
        );

        this.root.add([this.headerView.getRoot(), this.systemsView.getRoot()]);
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
        this.systemsView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }
}
