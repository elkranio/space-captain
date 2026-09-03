import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgeEnemyShipEquipmentGridView from "./equipment/BridgeEnemyShipEquipmentGridView";

const EQUIPMENT_GRID = {
    leftPadding: 16,
    y: 50,

    specialColumnWidth: 48,
    specialColumnGap: 4,

    rightPadding: 16,
    bottomPadding: 18,
} as const;

// Right half of the captain dashboard.
// Header and the left special column are intentionally reserved for the next atom.
export default class BridgeEnemyShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly equipmentGridView: BridgeEnemyShipEquipmentGridView;

    constructor(
        scene: BridgeScene,
        eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root = scene.add.container(0, 0);

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

        this.root.add(this.equipmentGridView.getRoot());
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
        this.root.destroy(false);
    }
}
