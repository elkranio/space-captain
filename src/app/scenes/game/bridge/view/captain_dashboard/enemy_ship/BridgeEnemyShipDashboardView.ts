import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgeEnemyShipEquipmentGridView from "./equipment/BridgeEnemyShipEquipmentGridView";
import BridgeEnemyShipHeaderView from "./header/BridgeEnemyShipHeaderView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 36,
} as const;

const EQUIPMENT_GRID = {
    leftPadding: 16,
    y: 50,

    specialColumnWidth: 48,
    specialColumnGap: 4,

    rightPadding: 16,
    bottomPadding: 18,
} as const;

// Right half of the captain dashboard.
// Header mirrors the player dashboard; the left special column is still reserved.
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

        const headerWidth = this.width - HEADER.sidePadding * 2;

        this.headerView = new BridgeEnemyShipHeaderView(
            scene,
            eventBus,
            headerWidth,
            HEADER.height,
        );
        this.headerView.setPosition(HEADER.sidePadding, HEADER.y);

        const equipmentGridX =
            EQUIPMENT_GRID.leftPadding +
            EQUIPMENT_GRID.specialColumnWidth +
            EQUIPMENT_GRID.specialColumnGap;

        const equipmentGridWidth =
            this.width -
            equipmentGridX -
            EQUIPMENT_GRID.rightPadding;

        const equipmentGridHeight =
            this.height -
            EQUIPMENT_GRID.y -
            EQUIPMENT_GRID.bottomPadding;

        this.equipmentGridView = new BridgeEnemyShipEquipmentGridView(
            scene,
            eventBus,
            equipmentGridWidth,
            equipmentGridHeight,
        );

        this.equipmentGridView.setPosition(
            equipmentGridX,
            EQUIPMENT_GRID.y,
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
