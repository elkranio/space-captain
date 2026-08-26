import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgePlayerShipEquipmentGridView from "./equipment/BridgePlayerShipEquipmentGridView";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgePlayerShipSpecialColumnView from "./special/BridgePlayerShipSpecialColumnView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 36,
} as const;

const EQUIPMENT_GRID = {
    x: 12,
    y: 50,

    rightPadding: 12,
    specialColumnWidth: 48,
    specialColumnGap: 4,

    bottomPadding: 14,
} as const;

// Левая половина captain dashboard.
//
// Header и equipment grid уже используют финальную полноразмерную геометрию.
// Справа от 4x3 grid уже рисуется placeholder column для BRIDGE / HULL.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    private readonly equipmentGridView: BridgePlayerShipEquipmentGridView;

    private readonly specialColumnView: BridgePlayerShipSpecialColumnView;

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

        const equipmentGridWidth =
            this.width -
            EQUIPMENT_GRID.x -
            EQUIPMENT_GRID.specialColumnGap -
            EQUIPMENT_GRID.specialColumnWidth -
            EQUIPMENT_GRID.rightPadding;

        const equipmentGridHeight = this.height - EQUIPMENT_GRID.y - EQUIPMENT_GRID.bottomPadding;

        this.equipmentGridView = new BridgePlayerShipEquipmentGridView(
            scene,
            equipmentGridWidth,
            equipmentGridHeight,
        );
        this.equipmentGridView.setPosition(EQUIPMENT_GRID.x, EQUIPMENT_GRID.y);

        this.specialColumnView = new BridgePlayerShipSpecialColumnView(
            scene,
            EQUIPMENT_GRID.specialColumnWidth,
            equipmentGridHeight,
        );
        this.specialColumnView.setPosition(
            EQUIPMENT_GRID.x + equipmentGridWidth + EQUIPMENT_GRID.specialColumnGap,
            EQUIPMENT_GRID.y,
        );

        this.root.add([
            this.headerView.getRoot(),
            this.equipmentGridView.getRoot(),
            this.specialColumnView.getRoot(),
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
        this.specialColumnView.destroy();
        this.equipmentGridView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }
}
