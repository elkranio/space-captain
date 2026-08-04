// src/app/scenes/game/bridge/view/ui/ship_status/BridgeShipStatusView.ts

import type BridgeScene from '../../../BridgeScene';
import {
    BRIDGE_EVENT,
    type BridgePlayerShipStatusUpdatedPayload,
    type BridgePlayerWeaponsStatusUpdatedPayload,
} from '../../../events/bridge_event';
import type BridgeEventBus from '../../../events/BridgeEventBus';
import BridgeDriveStatusView from './drive/BridgeDriveStatusView';
import BridgeHullStatusView from './hull/BridgeHullStatusView';
import BridgePointDefenseChargesView from './point_defense/BridgePointDefenseChargesView';
import BridgeShieldChargesView from './shield/BridgeShieldChargesView';
import BridgePlayerWeaponsStatusView from './weapons/BridgePlayerWeaponsStatusView';

const SHIP_STATUS_PANEL = {
    y: 4,

    width: 480,
    height: 56,

    backgroundColor: 0x10131d,
    backgroundAlpha: 0.9,

    borderColor: 0x58677a,
    borderThickness: 2,
} as const;

const HULL_STATUS_POSITION =
    new Phaser.Math.Vector2(12, 8);

const POINT_DEFENSE_STATUS_POSITION =
    new Phaser.Math.Vector2(128, 8);

const SHIELD_STATUS_POSITION =
    new Phaser.Math.Vector2(244, 8);

const DRIVE_STATUS_POSITION =
    new Phaser.Math.Vector2(376, 8);

const WEAPONS_STATUS_POSITION =
    new Phaser.Math.Vector2(12, 32);

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

    private readonly pointDefenseView:
        BridgePointDefenseChargesView;

    private readonly shieldView: BridgeShieldChargesView;

    private readonly driveView: BridgeDriveStatusView;

    private readonly weaponsView:
        BridgePlayerWeaponsStatusView;

    constructor(
        scene: BridgeScene,

        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = scene.add.container(
            scene.cameras.main.centerX -
                SHIP_STATUS_PANEL.width / 2,

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

        this.hullView =
            new BridgeHullStatusView(scene);

        this.hullView.setPosition(
            HULL_STATUS_POSITION.x,
            HULL_STATUS_POSITION.y,
        );

        this.pointDefenseView =
            new BridgePointDefenseChargesView(scene);

        this.pointDefenseView.setPosition(
            POINT_DEFENSE_STATUS_POSITION.x,
            POINT_DEFENSE_STATUS_POSITION.y,
        );

        this.shieldView =
            new BridgeShieldChargesView(scene);

        this.shieldView.setPosition(
            SHIELD_STATUS_POSITION.x,
            SHIELD_STATUS_POSITION.y,
        );

        this.driveView =
            new BridgeDriveStatusView(scene);

        this.driveView.setPosition(
            DRIVE_STATUS_POSITION.x,
            DRIVE_STATUS_POSITION.y,
        );

        this.weaponsView =
            new BridgePlayerWeaponsStatusView(
                scene,
            );

        this.weaponsView.setPosition(
            WEAPONS_STATUS_POSITION.x,
            WEAPONS_STATUS_POSITION.y,
        );

        this.root.add([
            this.background,

            this.hullView.getRoot(),
            this.pointDefenseView.getRoot(),
            this.shieldView.getRoot(),
            this.driveView.getRoot(),
            this.weaponsView.getRoot(),
        ]);

        this.eventBus.on(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            this.handlePlayerShipStatusUpdated,
            this,
        );

        this.eventBus.on(
            BRIDGE_EVENT
                .PLAYER_WEAPONS_STATUS_UPDATED,

            this.handlePlayerWeaponsStatusUpdated,
            this,
        );
    }

    public destroy(): void {
        this.eventBus.off(
            BRIDGE_EVENT.PLAYER_SHIP_STATUS_UPDATED,

            this.handlePlayerShipStatusUpdated,
            this,
        );

        this.eventBus.off(
            BRIDGE_EVENT
                .PLAYER_WEAPONS_STATUS_UPDATED,

            this.handlePlayerWeaponsStatusUpdated,
            this,
        );

        this.weaponsView.destroy();
        this.driveView.destroy();
        this.shieldView.destroy();
        this.pointDefenseView.destroy();
        this.hullView.destroy();

        this.background.destroy();
        this.root.destroy(false);
    }

    private handlePlayerShipStatusUpdated(
        payload: BridgePlayerShipStatusUpdatedPayload,
    ): void {
        this.hullView.setState(
            payload.hull.current,
            payload.hull.max,
        );

        this.pointDefenseView.setState(
            payload.pointDefense.current,
            payload.pointDefense.max,
        );

        this.shieldView.setState(
            payload.shieldGenerator.current,
            payload.shieldGenerator.max,
        );

        this.driveView.setState(
            payload.drive.status,
        );
    }

    private handlePlayerWeaponsStatusUpdated(
        payload:
            BridgePlayerWeaponsStatusUpdatedPayload,
    ): void {
        this.weaponsView.setState(
            payload,
        );
    }
}
