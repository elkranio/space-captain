// src/app/scenes/game/bridge/view/combat/BridgeCombatView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import type BridgeSpaceView from '../space/BridgeSpaceView';
import BridgeVfxView from '../vfx/BridgeVfxView';
import BridgeEnemyShipDestructionView from './enemy_destruction/BridgeEnemyShipDestructionView';
import BridgeEnemyEvadeView from './enemy_evade/BridgeEnemyEvadeView';
import BridgeEnemyShieldView from './enemy_shield/BridgeEnemyShieldView';
import BridgeIncomingMissilesView from './incoming_missiles/BridgeIncomingMissilesView';
import BridgeBeamCannonBeamsView from './beam_cannon_beams/BridgeBeamCannonBeamsView';
import BridgeBeamCannonThreatsView from './beam_cannon_threats/BridgeBeamCannonThreatsView';
import BridgeOutgoingMissilesView from './outgoing_missiles/BridgeOutgoingMissilesView';
import BridgeOutgoingSpamView from './outgoing_spam/BridgeOutgoingSpamView';
import BridgeOutgoingStickyMinesView from './outgoing_sticky_mines/BridgeOutgoingStickyMinesView';
import BridgePlayerBeamCannonView from './player_beam_cannon/BridgePlayerBeamCannonView';
import BridgePlayerEvadeView from './player_evade/BridgePlayerEvadeView';
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

    private beamCannonThreatsView?: BridgeBeamCannonThreatsView;

    private beamCannonBeamsView?: BridgeBeamCannonBeamsView;

    private enemyShieldView?:
        BridgeEnemyShieldView;

    private enemyEvadeView?:
        BridgeEnemyEvadeView;

    private playerBeamCannonView?: BridgePlayerBeamCannonView;

    private playerShieldView?:
        BridgePlayerShieldView;

    private playerEvadeView?:
        BridgePlayerEvadeView;

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

                (objectId) => {
                    return this.spaceView
                        .getObjectVisualBounds(
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

        this.beamCannonThreatsView = new BridgeBeamCannonThreatsView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView.getObjectPosition(objectId);
            },
        );

        this.beamCannonBeamsView = new BridgeBeamCannonBeamsView(
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

        this.enemyEvadeView =
            new BridgeEnemyEvadeView(
                this.scene,
                this.eventBus,

                (objectId) => {
                    return this.spaceView
                        .getObjectVisualBounds(
                            objectId,
                        );
                },

                (
                    objectId,
                    offsetX,
                ) => {
                    return this.spaceView
                        .setObjectPresentationOffsetX(
                            objectId,
                            offsetX,
                        );
                },
            );

        this.playerBeamCannonView = new BridgePlayerBeamCannonView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return this.spaceView
                    .getObjectPosition(
                        objectId,
                    );
            },

            (objectId) => {
                return this.spaceView
                    .getObjectVisualBounds(
                        objectId,
                    );
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

        // Created last so near-camera Evade dust remains above physical
        // world/combat VFX while still staying below projection/bridge/UI.
        this.playerEvadeView =
            new BridgePlayerEvadeView(
                this.scene,
                this.eventBus,
            );
    }

    public destroy(): void {
        this.playerEvadeView?.destroy();
        this.stickyMinesView?.destroy();
        this.spamView?.destroy();
        this.vfxView?.destroy();
        this.enemyShipDestructionView
            ?.destroy();
        this.playerShieldView?.destroy();
        this.playerBeamCannonView?.destroy();
        this.enemyEvadeView?.destroy();
        this.enemyShieldView?.destroy();
        this.beamCannonBeamsView?.destroy();
        this.beamCannonThreatsView?.destroy();
        this.outgoingStickyMinesView
            ?.destroy();
        this.outgoingSpamView?.destroy();
        this.outgoingMissilesView?.destroy();
        this.incomingMissilesView?.destroy();

        this.playerEvadeView = undefined;
        this.stickyMinesView = undefined;
        this.spamView = undefined;
        this.vfxView = undefined;
        this.enemyShipDestructionView =
            undefined;
        this.playerShieldView = undefined;
        this.playerBeamCannonView = undefined;
        this.enemyEvadeView = undefined;
        this.enemyShieldView = undefined;
        this.beamCannonBeamsView = undefined;
        this.beamCannonThreatsView = undefined;
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

        this.beamCannonThreatsView
            ?.setCameraTurnOffsetX(
                offsetX,
            );

    }
}
