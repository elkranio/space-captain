import {
    CAPTAIN_DASHBOARD_SPRITE_ID,
    CAPTAIN_DASHBOARD_SPRITES,
} from "../../../../../manifests/bridge/captain_dashboard";
import type BridgeScene from "../../BridgeScene";
import type BridgeEventBus from "../../events/BridgeEventBus";
import BridgePlayerShipDashboardView from "./player_ship/BridgePlayerShipDashboardView";

// Root view капитанского dashboard.
//
// Два физических captain screen являются общей рамкой dashboard.
// The old right-side combat context is intentionally disconnected pending replacement.
export default class BridgeCaptainDashboardView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly playerShipScreen: Phaser.GameObjects.Image;

    private readonly combatContextScreen: Phaser.GameObjects.Image;

    private readonly playerShipView: BridgePlayerShipDashboardView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.root = scene.add.container(0, 0);

        scene.layers.get("ui").add(this.root);

        const screenSprite = CAPTAIN_DASHBOARD_SPRITES[CAPTAIN_DASHBOARD_SPRITE_ID.SCREEN];

        this.playerShipScreen = scene.add
            .image(0, 0, screenSprite.atlasKey, screenSprite.frameKey)
            .setOrigin(0, 0);

        this.combatContextScreen = scene.add
            .image(0, 0, screenSprite.atlasKey, screenSprite.frameKey)
            .setOrigin(0, 0);

        const screensWidth = this.playerShipScreen.width + this.combatContextScreen.width;
        const screensX = Math.round((scene.scale.width - screensWidth) / 2);
        const screensY = scene.scale.height - this.playerShipScreen.height;
        const combatContextScreenX = screensX + this.playerShipScreen.width;

        this.playerShipScreen.setPosition(screensX, screensY);
        this.combatContextScreen.setPosition(combatContextScreenX, screensY);

        this.playerShipView = new BridgePlayerShipDashboardView(
            scene,
            eventBus,
            this.playerShipScreen.width,
            this.playerShipScreen.height,
        );

        const playerShipSize = this.playerShipView.getSize();

        this.playerShipView.setPosition(
            screensX + Math.round((this.playerShipScreen.width - playerShipSize.width) / 2),
            screensY + Math.round((this.playerShipScreen.height - playerShipSize.height) / 2),
        );

        this.root.add([
            this.playerShipScreen,
            this.combatContextScreen,
            this.playerShipView.getRoot(),
        ]);
    }

    public destroy(): void {
        this.playerShipView.destroy();

        this.playerShipScreen.destroy();
        this.combatContextScreen.destroy();

        this.root.destroy(false);
    }
}
