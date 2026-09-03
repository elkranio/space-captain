import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../BridgeScene";
import type BridgeEventBus from "../../events/BridgeEventBus";
import BridgeEnemyShipDashboardView from "./enemy_ship/BridgeEnemyShipDashboardView";
import BridgePlayerShipDashboardView from "./player_ship/BridgePlayerShipDashboardView";

// Root view капитанского dashboard.
//
// Два физических captain screen являются общей рамкой dashboard.
// Левая половина показывает player ship, правая — persistent read-only enemy ship.
export default class BridgeCaptainDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly playerShipScreen: Phaser.GameObjects.Image;

    private readonly enemyShipScreen: Phaser.GameObjects.Image;

    private readonly playerShipView: BridgePlayerShipDashboardView;

    private readonly enemyShipView: BridgeEnemyShipDashboardView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.root = scene.add.container(0, 0);

        scene.layers.get("ui").add(this.root);

        const screenSprite = CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.SCREEN];

        this.playerShipScreen = scene.add
            .image(0, 0, screenSprite.atlasKey, screenSprite.frameKey)
            .setOrigin(0, 0);

        this.enemyShipScreen = scene.add
            .image(0, 0, screenSprite.atlasKey, screenSprite.frameKey)
            .setOrigin(0, 0);

        const screensWidth = this.playerShipScreen.width + this.enemyShipScreen.width;
        const screensX = Math.round((scene.scale.width - screensWidth) / 2);
        const screensY = scene.scale.height - this.playerShipScreen.height;
        const enemyShipScreenX = screensX + this.playerShipScreen.width;

        this.playerShipScreen.setPosition(screensX, screensY);
        this.enemyShipScreen.setPosition(enemyShipScreenX, screensY);

        this.playerShipView = new BridgePlayerShipDashboardView(
            scene,
            eventBus,
            this.playerShipScreen.width,
            this.playerShipScreen.height,
        );

        this.playerShipView.setPosition(screensX, screensY);

        this.enemyShipView = new BridgeEnemyShipDashboardView(
            scene,
            eventBus,
            this.enemyShipScreen.width,
            this.enemyShipScreen.height,
        );

        this.enemyShipView.setPosition(enemyShipScreenX, screensY);

        this.root.add([
            this.playerShipScreen,
            this.enemyShipScreen,
            this.playerShipView.getRoot(),
            this.enemyShipView.getRoot(),
        ]);
    }

    public destroy(): void {
        this.enemyShipView.destroy();
        this.playerShipView.destroy();

        this.playerShipScreen.destroy();
        this.enemyShipScreen.destroy();

        this.root.destroy(false);
    }
}
