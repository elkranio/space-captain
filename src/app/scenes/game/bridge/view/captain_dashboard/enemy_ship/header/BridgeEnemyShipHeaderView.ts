// src/app/scenes/game/bridge/view/captain_dashboard/enemy_ship/header/BridgeEnemyShipHeaderView.ts
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import BridgeShipDashboardHeaderView from "../../BridgeShipDashboardHeaderView";

// Enemy event adapter for the shared ship dashboard header presentation.
export default class BridgeEnemyShipHeaderView {
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
        this.headerView.setVisible(false);
        this.headerView.setPowerCoreVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
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
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.headerView.destroy();
    }

    private handleDashboardUpdated(
        payload: BridgeEnemyShipDashboardUpdatedPayload,
    ): void {
        if (!payload) {
            this.headerView.setVisible(false);
            this.headerView.clearHull();
            this.clearPowerCore();
            return;
        }

        this.headerView.setVisible(true);
        this.headerView.setHull(payload.hull.current, payload.hull.max);

        const powerCore = payload.powerCore;

        if (!powerCore) {
            this.clearPowerCore();
            return;
        }

        this.headerView.setPowerCoreVisible(true);
        this.headerView.setPowerCore(
            powerCore.current,
            powerCore.max,
            powerCore.rechargeProgress,
        );
    }

    private clearPowerCore(): void {
        this.headerView.clearPowerCore();
        this.headerView.setPowerCoreVisible(false);
    }
}
