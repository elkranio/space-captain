import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../captain_dashboard_layout";
import BridgeEnemyShipChassisView from "./equipment/BridgeEnemyShipChassisView";
import BridgeEnemyShipHeaderView from "./header/BridgeEnemyShipHeaderView";

const DASHBOARD = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard;

// Right half of the captain dashboard.
// The content area mirrors the enemy chassis schematic; header targeting remains separate for now.
export default class BridgeEnemyShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgeEnemyShipHeaderView;

    private readonly chassisView: BridgeEnemyShipChassisView;

    constructor(
        scene: BridgeScene,
        eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root = scene.add.container(0, 0);

        const headerWidth = this.width - DASHBOARD.header.sidePadding * 2;

        this.headerView = new BridgeEnemyShipHeaderView(
            scene,
            eventBus,
            headerWidth,
            DASHBOARD.header.height,
        );
        this.headerView.setPosition(DASHBOARD.header.sidePadding, DASHBOARD.header.y);

        const chassisWidth =
            this.width -
            DASHBOARD.content.x -
            DASHBOARD.content.rightPadding;

        const chassisHeight =
            this.height -
            DASHBOARD.content.y -
            DASHBOARD.content.bottomPadding;

        this.chassisView = new BridgeEnemyShipChassisView(
            scene,
            eventBus,
            chassisWidth,
            chassisHeight,
        );

        this.chassisView.setPosition(
            DASHBOARD.content.x,
            DASHBOARD.content.y,
        );

        this.root.add([
            this.headerView.getRoot(),
            this.chassisView.getRoot(),
        ]);
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.root;
    }

    public setPosition(x: number, y: number): void {
        this.root.setPosition(x, y);
    }

    public destroy(): void {
        this.chassisView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }
}
