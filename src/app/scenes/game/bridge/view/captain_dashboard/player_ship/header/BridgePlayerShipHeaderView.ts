// src/app/scenes/game/bridge/view/captain_dashboard/player_ship/header/BridgePlayerShipHeaderView.ts
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgePlayerShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import BridgeShipDashboardHeaderView from "../../BridgeShipDashboardHeaderView";

// Player event adapter for the shared ship dashboard header presentation.
export default class BridgePlayerShipHeaderView {
    private readonly headerView: BridgeShipDashboardHeaderView;

    constructor(
        scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        width: number,
        height: number,
    ) {
        this.headerView = new BridgeShipDashboardHeaderView(
            scene,
            width,
            height,
        );

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );
    }

    public getRoot(): Phaser.GameObjects.Container {
        return this.headerView.getRoot();
    }

    public setPosition(x: number, y: number): void {
        this.headerView.setPosition(x, y);
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.headerView.destroy();
    }

    private handleDashboardUpdated(
        payload: BridgePlayerShipDashboardUpdatedPayload,
    ): void {
        const hull = payload.status?.hull;

        if (hull) {
            this.headerView.setHull(hull.current, hull.max);
        } else {
            this.headerView.clearHull();
        }

        const powerCore = payload.status?.powerCore;

        if (!powerCore) {
            this.headerView.clearPowerCore();
            return;
        }

        this.headerView.setPowerCore(
            powerCore.current,
            powerCore.max,
            powerCore.rechargeProgress,
        );
    }
}
