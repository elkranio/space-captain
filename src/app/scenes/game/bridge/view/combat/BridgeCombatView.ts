// src/app/scenes/game/bridge/view/combat/BridgeCombatView.ts

import type BridgeScene from "../../BridgeScene";
import type BridgeEventBus from "../../events/BridgeEventBus";
import type BridgeSpaceView from "../space/BridgeSpaceView";
import BridgeVfxView from "../vfx/BridgeVfxView";
import BridgeEnemyShipDestructionView from "./enemy_destruction/BridgeEnemyShipDestructionView";
import BridgeEnemyEvadeView from "./enemy_evade/BridgeEnemyEvadeView";
import BridgeEnemyShieldView from "./enemy_shield/BridgeEnemyShieldView";
import BridgeIncomingMissilesView from "./incoming_missiles/BridgeIncomingMissilesView";
import BridgeBeamCannonBeamsView from "./beam_cannon_beams/BridgeBeamCannonBeamsView";
import BridgeBeamCannonThreatsView from "./beam_cannon_threats/BridgeBeamCannonThreatsView";
import BridgeOutgoingMissilesView from "./outgoing_missiles/BridgeOutgoingMissilesView";
import BridgeOutgoingSpamView from "./outgoing_spam/BridgeOutgoingSpamView";
import BridgeOutgoingStickyMinesView from "./outgoing_sticky_mines/BridgeOutgoingStickyMinesView";
import BridgePlayerBeamCannonView from "./player_beam_cannon/BridgePlayerBeamCannonView";
import BridgePlayerEvadeView from "./player_evade/BridgePlayerEvadeView";
import BridgePlayerShieldView from "./player_shield/BridgePlayerShieldView";
import BridgeSpamView from "./spam/BridgeSpamView";
import BridgeStickyMinesView from "./sticky_mines/BridgeStickyMinesView";

// Composition root for bridge combat presentation.
//
// Owns only visual combat modules and their shared
// dependency on BridgeSpaceView object positions.
export default class BridgeCombatView {
    private enemyShipDestructionView?: BridgeEnemyShipDestructionView;

    private incomingMissilesView?: BridgeIncomingMissilesView;

    private outgoingMissilesView?: BridgeOutgoingMissilesView;

    private outgoingStickyMinesView?: BridgeOutgoingStickyMinesView;

    private outgoingSpamView?: BridgeOutgoingSpamView;

    private beamCannonThreatsView?: BridgeBeamCannonThreatsView;

    private beamCannonBeamsView?: BridgeBeamCannonBeamsView;

    private enemyShieldView?: BridgeEnemyShieldView;

    private enemyEvadeView?: BridgeEnemyEvadeView;

    private playerBeamCannonView?: BridgePlayerBeamCannonView;

    private playerShieldView?: BridgePlayerShieldView;

    private playerEvadeView?: BridgePlayerEvadeView;

    private spamView?: BridgeSpamView;

    private stickyMinesView?: BridgeStickyMinesView;

    private vfxView?: BridgeVfxView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus, spaceView: BridgeSpaceView) {
        const getObjectPosition = (objectId: string) => {
            return spaceView.getObjectPosition(objectId);
        };

        const getObjectVisualBounds = (objectId: string) => {
            return spaceView.getObjectVisualBounds(objectId);
        };

        const setObjectPresentationOffsetX = (objectId: string, offsetX: number) => {
            return spaceView.setObjectPresentationOffsetX(objectId, offsetX);
        };

        this.incomingMissilesView = new BridgeIncomingMissilesView(
            scene,
            eventBus,

            getObjectPosition,
        );

        this.outgoingMissilesView = new BridgeOutgoingMissilesView(
            scene,
            eventBus,

            getObjectPosition,

            getObjectVisualBounds,
        );

        this.outgoingStickyMinesView = new BridgeOutgoingStickyMinesView(
            scene,
            eventBus,

            getObjectPosition,

            getObjectVisualBounds,
        );

        this.outgoingSpamView = new BridgeOutgoingSpamView(
            scene,
            eventBus,

            getObjectVisualBounds,
        );

        this.beamCannonThreatsView = new BridgeBeamCannonThreatsView(
            scene,
            eventBus,

            getObjectPosition,
        );

        this.beamCannonBeamsView = new BridgeBeamCannonBeamsView(
            scene,
            eventBus,

            getObjectPosition,
        );

        this.enemyShieldView = new BridgeEnemyShieldView(
            scene,
            eventBus,

            getObjectPosition,
        );

        this.enemyEvadeView = new BridgeEnemyEvadeView(
            scene,
            eventBus,

            getObjectVisualBounds,

            setObjectPresentationOffsetX,
        );

        this.playerBeamCannonView = new BridgePlayerBeamCannonView(
            scene,
            eventBus,

            getObjectPosition,

            getObjectVisualBounds,
        );

        this.playerShieldView = new BridgePlayerShieldView(scene, eventBus);

        this.enemyShipDestructionView = new BridgeEnemyShipDestructionView(
            scene,
            eventBus,

            getObjectPosition,
        );

        this.vfxView = new BridgeVfxView(scene, eventBus);

        this.spamView = new BridgeSpamView(scene, eventBus);

        this.stickyMinesView = new BridgeStickyMinesView(
            scene,
            eventBus,

            getObjectPosition,
        );

        // Created last so near-camera Evade dust remains above physical
        // world/combat VFX while still staying below projection/bridge/UI.
        this.playerEvadeView = new BridgePlayerEvadeView(scene, eventBus);
    }

    public destroy(): void {
        this.playerEvadeView?.destroy();
        this.stickyMinesView?.destroy();
        this.spamView?.destroy();
        this.vfxView?.destroy();
        this.enemyShipDestructionView?.destroy();
        this.playerShieldView?.destroy();
        this.playerBeamCannonView?.destroy();
        this.enemyEvadeView?.destroy();
        this.enemyShieldView?.destroy();
        this.beamCannonBeamsView?.destroy();
        this.beamCannonThreatsView?.destroy();
        this.outgoingStickyMinesView?.destroy();
        this.outgoingSpamView?.destroy();
        this.outgoingMissilesView?.destroy();
        this.incomingMissilesView?.destroy();

        this.playerEvadeView = undefined;
        this.stickyMinesView = undefined;
        this.spamView = undefined;
        this.vfxView = undefined;
        this.enemyShipDestructionView = undefined;
        this.playerShieldView = undefined;
        this.playerBeamCannonView = undefined;
        this.enemyEvadeView = undefined;
        this.enemyShieldView = undefined;
        this.beamCannonBeamsView = undefined;
        this.beamCannonThreatsView = undefined;
        this.outgoingStickyMinesView = undefined;
        this.outgoingSpamView = undefined;
        this.outgoingMissilesView = undefined;
        this.incomingMissilesView = undefined;
    }

    public setCameraTurnOffsetX(offsetX: number): void {
        this.incomingMissilesView?.setCameraTurnOffsetX(offsetX);

        this.outgoingMissilesView?.setCameraTurnOffsetX(offsetX);

        this.outgoingStickyMinesView?.setCameraTurnOffsetX(offsetX);

        this.outgoingSpamView?.setCameraTurnOffsetX(offsetX);

        this.beamCannonThreatsView?.setCameraTurnOffsetX(offsetX);
    }
}
