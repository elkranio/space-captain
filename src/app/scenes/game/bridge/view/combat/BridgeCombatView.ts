// src/app/scenes/game/bridge/view/combat/BridgeCombatView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import type BridgeSpaceView from '../space/BridgeSpaceView';
import BridgeVfxView from '../vfx/BridgeVfxView';
import BridgeEnemyShipDestructionView from './enemy_destruction/BridgeEnemyShipDestructionView';
import BridgeEnemyShieldView from './enemy_shield/BridgeEnemyShieldView';
import BridgeIncomingMissilesView from './incoming_missiles/BridgeIncomingMissilesView';
import BridgeLaserBeamsView from './laser_beams/BridgeLaserBeamsView';
import BridgeLaserThreatsView from './laser_threats/BridgeLaserThreatsView';
import BridgeOutgoingMissilesView from './outgoing_missiles/BridgeOutgoingMissilesView';
import BridgeOutgoingSpamView from './outgoing_spam/BridgeOutgoingSpamView';
import BridgeOutgoingStickyMinesView from './outgoing_sticky_mines/BridgeOutgoingStickyMinesView';
import BridgePlayerLaserView from './player_laser/BridgePlayerLaserView';
import BridgePlayerShieldView from './player_shield/BridgePlayerShieldView';
import BridgeSpamView from './spam/BridgeSpamView';
import BridgeStickyMinesView from './sticky_mines/BridgeStickyMinesView';

// Composition root for bridge combat presentation.
//
// Owns only visual combat modules and their shared
// dependency on BridgeSpaceView object positions.
export default class BridgeCombatView {
    private enemyShipDestructionView?:
        BridgeEnemyShipDestructionView;

    private incomingMissilesView?: BridgeIncomingMissilesView;

    private outgoingMissilesView?: BridgeOutgoingMissilesView;

    private outgoingStickyMinesView?:
        BridgeOutgoingStickyMinesView;

    private outgoingSpamView?:
        BridgeOutgoingSpamView;

    private laserThreatsView?: BridgeLaserThreatsView;

    private laserBeamsView?: BridgeLaserBeamsView;

    private enemyShieldView?:
        BridgeEnemyShieldView;

    private playerLaserView?: BridgePlayerLaserView;

    private playerShieldView?:
        BridgePlayerShieldView;

    private spamView?: BridgeSpamView;

    private stickyMinesView?: BridgeStickyMinesView;

    private vfxView?: BridgeVfxView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
        private readonly spaceView: BridgeSpaceView,
    ) {}

    public prepare(): void {
        this.incomingMissilesView = new BridgeIncomingMissilesView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );

        this.outgoingMissilesView =
            new BridgeOutgoingMissilesView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectPosition(
                            objectId,
                        );
                },
            );

        this.outgoingStickyMinesView =
            new BridgeOutgoingStickyMinesView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectPosition(
                            objectId,
                        );
                },
            );

        this.outgoingSpamView =
            new BridgeOutgoingSpamView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectPosition(
                            objectId,
                        );
                },
            );

        this.laserThreatsView = new BridgeLaserThreatsView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );

        this.laserBeamsView = new BridgeLaserBeamsView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );

        this.enemyShieldView =
            new BridgeEnemyShieldView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectPosition(
                            objectId,
                        );
                },
            );

        this.playerLaserView = new BridgePlayerLaserView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );

        this.playerShieldView =
            new BridgePlayerShieldView(
                this.scene,
                this.eventBus,
            );

        this.enemyShipDestructionView =
            new BridgeEnemyShipDestructionView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectPosition(
                            objectId,
                        );
                },
            );

        this.vfxView = new BridgeVfxView(this.scene, this.eventBus);

        this.spamView = new BridgeSpamView(
            this.scene,
            this.eventBus,
        );

        this.stickyMinesView = new BridgeStickyMinesView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );
    }

    public destroy(): void {
        this.stickyMinesView?.destroy();
        this.spamView?.destroy();
        this.vfxView?.destroy();
        this.enemyShipDestructionView
            ?.destroy();
        this.playerShieldView?.destroy();
        this.playerLaserView?.destroy();
        this.enemyShieldView?.destroy();
        this.laserBeamsView?.destroy();
        this.laserThreatsView?.destroy();
        this.outgoingStickyMinesView
            ?.destroy();
        this.outgoingSpamView?.destroy();
        this.outgoingMissilesView?.destroy();
        this.incomingMissilesView?.destroy();

        this.stickyMinesView = undefined;
        this.spamView = undefined;
        this.vfxView = undefined;
        this.enemyShipDestructionView =
            undefined;
        this.playerShieldView = undefined;
        this.playerLaserView = undefined;
        this.enemyShieldView = undefined;
        this.laserBeamsView = undefined;
        this.laserThreatsView = undefined;
        this.outgoingStickyMinesView =
            undefined;
        this.outgoingSpamView = undefined;
        this.outgoingMissilesView = undefined;
        this.incomingMissilesView = undefined;
    }

    public setCameraTurnOffsetX(
        offsetX: number,
    ): void {
        this.incomingMissilesView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

        this.outgoingMissilesView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

        this.outgoingStickyMinesView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

        this.outgoingSpamView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

        this.laserThreatsView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

    }
}
