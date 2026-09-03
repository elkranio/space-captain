// src/app/scenes/game/bridge/view/captain_dashboard/enemy_ship/header/BridgeEnemyShipHeaderView.ts
import type BridgeScene from "../../../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeEnemyShipDashboardUpdatedPayload,
} from "../../../../events/bridge_event";
import type BridgeEventBus from "../../../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_STYLE } from "../../captain_dashboard_style";
import BridgeHullStatusView from "../../BridgeHullStatusView";
import BridgePowerCoreStatusView from "../../BridgePowerCoreStatusView";

const HULL_X = 8;
const POWER_CORE_RIGHT_PADDING = 12;

// Top strip for the persistent enemy dashboard.
// HULL and Power Core both come from the current enemy snapshot.
export default class BridgeEnemyShipHeaderView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly hullView: BridgeHullStatusView;

    private readonly powerCoreView: BridgePowerCoreStatusView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly width: number,
        private readonly height: number,
    ) {
        this.root = this.scene.add.container(0, 0);

        this.hullView = new BridgeHullStatusView(this.scene, this.height);
        this.hullView.setPosition(HULL_X, 0);

        this.powerCoreView = new BridgePowerCoreStatusView(
            this.scene,
            this.height,
        );
        this.powerCoreView.setRightEdge(
            this.width - POWER_CORE_RIGHT_PADDING,
        );
        this.powerCoreView.setVisible(false);

        const divider = this.scene.add
            .rectangle(
                0,
                this.height - 1,
                this.width,
                3,
                CAPTAIN_DASHBOARD_STYLE.header.dividerColor,
                1,
            )
            .setOrigin(0, 0);

        this.root.add([
            this.hullView.getRoot(),
            this.powerCoreView.getRoot(),
            divider,
        ]);
        this.root.setVisible(false);

        this.eventBus.on(
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
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
            BRIDGE_EVENT.ENEMY_SHIP_DASHBOARD_UPDATED,
            this.handleDashboardUpdated,
            this,
        );

        this.hullView.destroy();
        this.powerCoreView.destroy();
        this.root.destroy(true);
    }

    private handleDashboardUpdated(
        payload: BridgeEnemyShipDashboardUpdatedPayload,
    ): void {
        if (!payload) {
            this.root.setVisible(false);
            this.hullView.clear();
            this.clearPowerCore();
            return;
        }

        this.root.setVisible(true);
        this.hullView.update(payload.hull.current, payload.hull.max);

        const powerCore = payload.powerCore;

        if (!powerCore) {
            this.clearPowerCore();
            return;
        }

        this.powerCoreView.setVisible(true);
        this.powerCoreView.update(
            powerCore.current,
            powerCore.max,
            powerCore.rechargeProgress,
        );
    }

    private clearPowerCore(): void {
        this.powerCoreView.clear();
        this.powerCoreView.setVisible(false);
    }
}
