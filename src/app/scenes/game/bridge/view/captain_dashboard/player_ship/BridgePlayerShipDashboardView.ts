import type BridgeScene from "../../../BridgeScene";
import type BridgeEventBus from "../../../events/BridgeEventBus";
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
} from "../../../events/bridge_event";
import { CAPTAIN_DASHBOARD_LAYOUT } from "../captain_dashboard_layout";
import BridgePlayerShipChassisView from "./equipment/BridgePlayerShipChassisView";
import BridgePlayerShipHeaderView from "./header/BridgePlayerShipHeaderView";
import BridgeDefenseTurretInteractionView from "./interaction/defense_turret/BridgeDefenseTurretInteractionView";

const DASHBOARD = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard;

// Левая половина captain dashboard.
//
// Power Core temporarily remains in the header while chassis content owns the spatial surface below it.
export default class BridgePlayerShipDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly headerView: BridgePlayerShipHeaderView;

    private readonly chassisView: BridgePlayerShipChassisView;

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

        const chassisWidth =
            this.width -
            DASHBOARD.content.x -
            DASHBOARD.content.rightPadding;

        const chassisHeight = this.height - DASHBOARD.content.y - DASHBOARD.content.bottomPadding;

        this.chassisView = new BridgePlayerShipChassisView(
            scene,
            eventBus,
            chassisWidth,
            chassisHeight,
            () => this.openDefenseTurretInteraction(),
        );
        this.chassisView.setPosition(DASHBOARD.content.x, DASHBOARD.content.y);

        this.defenseTurretInteractionView = new BridgeDefenseTurretInteractionView(
            scene,
            eventBus,
            chassisWidth,
            chassisHeight,
            () => this.closeDefenseTurretInteraction(),
        );
        this.defenseTurretInteractionView.setPosition(DASHBOARD.content.x, DASHBOARD.content.y);
        this.defenseTurretInteractionView.close();

        this.root.add([
            this.headerView.getRoot(),
            this.chassisView.getRoot(),
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
        this.chassisView.destroy();
        this.headerView.destroy();
        this.root.destroy(false);
    }

    private openDefenseTurretInteraction(): void {
        this.defenseTurretInteractionOpen = true;
        this.chassisView.getRoot().setVisible(false);
        this.defenseTurretInteractionView.open();
    }

    private closeDefenseTurretInteraction(): void {
        this.defenseTurretInteractionOpen = false;
        this.defenseTurretInteractionView.close();
        this.chassisView.getRoot().setVisible(true);
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
