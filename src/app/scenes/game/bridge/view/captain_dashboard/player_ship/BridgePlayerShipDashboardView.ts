import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
} from "../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../captain_dashboard_layout";
import BridgePlayerShipEquipmentGridView from "./equipment/BridgePlayerShipEquipmentGridView";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgeDefenseTurretInteractionView from "./interaction/defense_turret/BridgeDefenseTurretInteractionView";

const DASHBOARD = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard;

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

        const headerWidth = this.width - DASHBOARD.header.sidePadding * 2;

        this.headerView = new BridgePlayerShipHeaderView(scene, eventBus, headerWidth, DASHBOARD.header.height);
        this.headerView.setPosition(DASHBOARD.header.sidePadding, DASHBOARD.header.y);

        const equipmentGridWidth =
            this.width -
            DASHBOARD.content.x -
            DASHBOARD.content.rightPadding;

        const equipmentGridHeight = this.height - DASHBOARD.content.y - DASHBOARD.content.bottomPadding;

        this.equipmentGridView = new BridgePlayerShipEquipmentGridView(
            scene,
            eventBus,
            equipmentGridWidth,
            equipmentGridHeight,
            () => this.openDefenseTurretInteraction(),
        );
        this.equipmentGridView.setPosition(DASHBOARD.content.x, DASHBOARD.content.y);

        this.defenseTurretInteractionView = new BridgeDefenseTurretInteractionView(
            scene,
            eventBus,
            equipmentGridWidth,
            equipmentGridHeight,
            () => this.closeDefenseTurretInteraction(),
        );
        this.defenseTurretInteractionView.setPosition(DASHBOARD.content.x, DASHBOARD.content.y);
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
