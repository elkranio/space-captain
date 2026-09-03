import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../captain_dashboard_layout";
import BridgeEnemyShipEquipmentGridView from "./equipment/BridgeEnemyShipEquipmentGridView";
import BridgeEnemyShipHeaderView from "./header/BridgeEnemyShipHeaderView";

const DASHBOARD = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard;

// Right half of the captain dashboard.
// HULL now lives in the header; the mirrored 4x3 grid uses the full content width.
export default class BridgeEnemyShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgeEnemyShipHeaderView;

    private readonly equipmentGridView: BridgeEnemyShipEquipmentGridView;

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

        const equipmentGridWidth =
            this.width -
            DASHBOARD.content.x -
            DASHBOARD.content.rightPadding;

        const equipmentGridHeight =
            this.height -
            DASHBOARD.content.y -
            DASHBOARD.content.bottomPadding;

        this.equipmentGridView = new BridgeEnemyShipEquipmentGridView(
            scene,
            eventBus,
            equipmentGridWidth,
            equipmentGridHeight,
        );

        this.equipmentGridView.setPosition(
            DASHBOARD.content.x,
            DASHBOARD.content.y,
        );

        this.root.add([
            this.headerView.getRoot(),
            this.equipmentGridView.getRoot(),
        ]);
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
        this.equipmentGridView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }
}
