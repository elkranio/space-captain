import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
} from "../../../events/bridge_event";
import BridgePlayerShipEquipmentGridView from "./equipment/BridgePlayerShipEquipmentGridView";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgeDefenseTurretInteractionView from "./interaction/defense_turret/BridgeDefenseTurretInteractionView";

const HEADER = {
    sidePadding: 12,
    y: 8,
    height: 36,
} as const;

const EQUIPMENT_GRID = {
    x: 16,
    y: 50,

    rightPadding: 16,
    bottomPadding: 18,
} as const;

// Левая половина captain dashboard.
//
// HULL now lives in the header; the 4x3 equipment grid uses the full content width.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    private readonly equipmentGridView: BridgePlayerShipEquipmentGridView;

    private readonly defenseTurretInteractionView: BridgeDefenseTurretInteractionView;

    private defenseTurretInteractionOpen = false;

    constructor(
        scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
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
            this.defenseTurretInteractionView.getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
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
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.defenseTurretInteractionView.destroy();
        this.equipmentGridView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }

    private openDefenseTurretInteraction(): void {
        this.defenseTurretInteractionOpen = true;
        this.equipmentGridView.getRoot().setVisible(false);
        this.defenseTurretInteractionView.open();
    }

    private closeDefenseTurretInteraction(): void {
        this.defenseTurretInteractionOpen = false;
        this.defenseTurretInteractionView.close();
        this.equipmentGridView.getRoot().setVisible(true);
    }

    private handleDashboardUpdated(
        payload: BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        if (!this.defenseTurretInteractionOpen) {
            return;
        }

        const defenseTurret = payload.status?.defenseTurret;

        if (defenseTurret && defenseTurret.integrity.current > 0) {
            return;
        }

        this.closeDefenseTurretInteraction();
    }
}
