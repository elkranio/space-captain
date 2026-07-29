// src/app/scenes/game/bridge/view/ui/ship_status/BridgeShipStatusView.ts

import type BridgeScene from '../../../BridgeScene';
import { BRIDGE_EVENT, type BridgePlayerShipStatusUpdatedPayload } from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeHullStatusView from './hull/BridgeHullStatusView';

const SHIP_STATUS_PANEL = {
    y: 4,

    width: 192,
    height: 32,

    backgroundColor: 0x10131d,
    backgroundAlpha: 0.9,

    borderColor: 0x58677a,
    borderThickness: 2,
} as const;

const HULL_STATUS_POSITION = new Phaser.Math.Vector2(12, 8);

// Временная root-view ship status panel.
//
// Отвечает за:
// - общий panel background;
// - раскладку дочерних status views;
// - bridge status snapshot events;
// - lifecycle дочерних views.
export default class BridgeShipStatusView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly background: Phaser.GameObjects.Rectangle;

    private readonly hullView: BridgeHullStatusView;

    constructor(
        scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = scene.add.container(
            scene.cameras.main.centerX - SHIP_STATUS_PANEL.width / 2,

            SHIP_STATUS_PANEL.y,
        );

        scene.layers.get('ui').add(this.root);

        this.background = scene.add
            .rectangle(
                0,
                0,

                SHIP_STATUS_PANEL.width,
                SHIP_STATUS_PANEL.height,

                SHIP_STATUS_PANEL.backgroundColor,

                SHIP_STATUS_PANEL.backgroundAlpha,
            )
            .setOrigin(0, 0)
            .setStrokeStyle(
                SHIP_STATUS_PANEL.borderThickness,

                SHIP_STATUS_PANEL.borderColor,
            );

        this.hullView = new BridgeHullStatusView(scene);

        this.hullView.setPosition(HULL_STATUS_POSITION.x, HULL_STATUS_POSITION.y);

        this.root.add([this.background, this.hullView.getRoot()]);

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            this.handlePlayerShipStatusUpdated,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            this.handlePlayerShipStatusUpdated,
            this,
        );

        this.hullView.destroy();
        this.background.destroy();

        this.root.destroy(false);
    }

    private handlePlayerShipStatusUpdated(payload: BridgePlayerShipStatusUpdatedPayload): void {
        this.hullView.setState(payload.hull.current, payload.hull.max);
    }
}
