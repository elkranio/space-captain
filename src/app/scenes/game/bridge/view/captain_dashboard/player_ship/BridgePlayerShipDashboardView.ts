import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import BridgePlayerShipEquipmentGridView from "./equipment/BridgePlayerShipEquipmentGridView";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgeDefenseTurretInteractionView from "./interaction/defense_turret/BridgeDefenseTurretInteractionView";
import BridgePlayerShipSpecialColumnView from "./special/BridgePlayerShipSpecialColumnView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 36,
} as const;

const EQUIPMENT_GRID = {
    x: 16,
    y: 50,

    rightPadding: 16,
    specialColumnWidth: 48,
    specialColumnGap: 4,

    bottomPadding: 18,
} as const;

// Левая половина captain dashboard.
//
// Header и equipment grid уже используют финальную полноразмерную геометрию.
// Справа от 4x3 grid HULL показывает authoritative HP, BRIDGE пока остается placeholder.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    private readonly equipmentGridView: BridgePlayerShipEquipmentGridView;

    private readonly specialColumnView: BridgePlayerShipSpecialColumnView;

    private readonly defenseTurretInteractionView: BridgeDefenseTurretInteractionView;

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
            eventBus,
            equipmentGridWidth,
            equipmentGridHeight,
            () => this.openDefenseTurretInteraction(),
        );
        this.equipmentGridView.setPosition(EQUIPMENT_GRID.x, EQUIPMENT_GRID.y);

        this.specialColumnView = new BridgePlayerShipSpecialColumnView(
            scene,
            eventBus,
            EQUIPMENT_GRID.specialColumnWidth,
            equipmentGridHeight,
        );
        this.specialColumnView.setPosition(
            EQUIPMENT_GRID.x + equipmentGridWidth + EQUIPMENT_GRID.specialColumnGap,
            EQUIPMENT_GRID.y,
        );

        const interactionWidth = this.width - EQUIPMENT_GRID.x - EQUIPMENT_GRID.rightPadding;

        this.defenseTurretInteractionView = new BridgeDefenseTurretInteractionView(
            scene,
            eventBus,
            interactionWidth,
            equipmentGridHeight,
            () => this.closeDefenseTurretInteraction(),
        );
        this.defenseTurretInteractionView.setPosition(EQUIPMENT_GRID.x, EQUIPMENT_GRID.y);
        this.defenseTurretInteractionView.close();

        this.root.add([
            this.headerView.getRoot(),
            this.equipmentGridView.getRoot(),
            this.specialColumnView.getRoot(),
            this.defenseTurretInteractionView.getRoot(),
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
        this.defenseTurretInteractionView.destroy();
        this.specialColumnView.destroy();
        this.equipmentGridView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }

    private openDefenseTurretInteraction(): void {
        this.equipmentGridView.getRoot().setVisible(false);
        this.specialColumnView.getRoot().setVisible(false);
        this.defenseTurretInteractionView.open();
    }

    private closeDefenseTurretInteraction(): void {
        this.defenseTurretInteractionView.close();
        this.equipmentGridView.getRoot().setVisible(true);
        this.specialColumnView.getRoot().setVisible(true);
    }
}
