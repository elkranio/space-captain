import type BridgeScene from "../../BridgeScene";
import type BridgeEventBus from "../../events/BridgeEventBus";
import { CAPTAIN_DASHBOARD_LAYOUT } from "./captain_dashboard_layout";
import BridgeEnemyShipDashboardView from "./enemy_ship/BridgeEnemyShipDashboardView";
import BridgePlayerShipDashboardView from "./player_ship/BridgePlayerShipDashboardView";

const DASHBOARD = CAPTAIN_DASHBOARD_LAYOUT.shipDashboard;
const LIVE_UI_OFFSET_Y = -5;

// Root view капитанского dashboard.
//
// Физическая рамка и фон обоих экранов уже запечены в bridge interior.
// Здесь остаётся только живой UI player/enemy ship поверх него.
export default class BridgeCaptainDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly playerShipView: BridgePlayerShipDashboardView;

    private readonly enemyShipView: BridgeEnemyShipDashboardView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.root = scene.add.container(0, 0);

        scene.layers.get("ui").add(this.root);

        const dashboardsWidth = DASHBOARD.width * 2;
        const dashboardsX = Math.round((scene.scale.width - dashboardsWidth) / 2);
        const dashboardsY = scene.scale.height - DASHBOARD.height + LIVE_UI_OFFSET_Y;
        const enemyShipDashboardX = dashboardsX + DASHBOARD.width;

        this.playerShipView = new BridgePlayerShipDashboardView(
            scene,
            eventBus,
            DASHBOARD.width,
            DASHBOARD.height,
        );

        this.playerShipView.setPosition(dashboardsX, dashboardsY);

        this.enemyShipView = new BridgeEnemyShipDashboardView(
            scene,
            eventBus,
            DASHBOARD.width,
            DASHBOARD.height,
        );

        this.enemyShipView.setPosition(enemyShipDashboardX, dashboardsY);

        this.root.add([
            this.playerShipView.getRoot(),
            this.enemyShipView.getRoot(),
        ]);
    }

    public destroy(): void {
        this.enemyShipView.destroy();
        this.playerShipView.destroy();
        this.root.destroy(false);
    }
}
