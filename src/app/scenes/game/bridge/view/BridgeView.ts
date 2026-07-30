// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from '../BridgeScene';
import type BridgeEventBus from '../events/BridgeEventBus';
import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';
import BridgeIncomingMissilesView from './combat/incoming_missiles/BridgeIncomingMissilesView';
import BridgeLaserThreatsView from './combat/laser_threats/BridgeLaserThreatsView';
import BridgeCrewView from './crew/BridgeCrewView';
import BridgeTargetingWarningView from './indicators/targeting_warning/BridgeTargetingWarningView';
import BridgeInteriorView from './interior/BridgeInteriorView';
import BridgeSpaceView from './space/BridgeSpaceView';
import BridgeUiView from './ui/BridgeUiView';
import BridgeVfxView from './vfx/BridgeVfxView';

// Root view bridge scene.
// Собирает визуальные модули bridge и отвечает только за их lifecycle.
export default class BridgeView {
    private interiorView?: BridgeInteriorView;

    private targetingWarningView?: BridgeTargetingWarningView;

    private incomingMissilesView?: BridgeIncomingMissilesView;

    private laserThreatsView?: BridgeLaserThreatsView;

    private crewView?: BridgeCrewView;

    private spaceView?: BridgeSpaceView;

    private vfxView?: BridgeVfxView;

    private uiView?: BridgeUiView;

    private officerBarksView?: BridgeOfficerBarksView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public prepare(): void {
        const spaceView = new BridgeSpaceView(this.scene, this.eventBus);

        this.spaceView = spaceView;

        this.incomingMissilesView = new BridgeIncomingMissilesView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return spaceView.getObjectPosition(objectId);
            },
        );

        this.laserThreatsView = new BridgeLaserThreatsView(
            this.scene,
            this.eventBus,

            (objectId) => {
                return spaceView.getObjectPosition(objectId);
            },
        );

        this.vfxView = new BridgeVfxView(this.scene, this.eventBus);

        this.interiorView = new BridgeInteriorView(this.scene);

        this.targetingWarningView = new BridgeTargetingWarningView(this.scene, this.eventBus);

        this.crewView = new BridgeCrewView(this.scene, this.eventBus);

        this.uiView = new BridgeUiView(this.scene, this.eventBus);

        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.officerBarksView?.destroy();
        this.uiView?.destroy();
        this.crewView?.destroy();
        this.targetingWarningView?.destroy();
        this.interiorView?.destroy();
        this.vfxView?.destroy();
        this.laserThreatsView?.destroy();
        this.incomingMissilesView?.destroy();
        this.spaceView?.destroy();

        this.officerBarksView = undefined;
        this.uiView = undefined;
        this.crewView = undefined;
        this.targetingWarningView = undefined;
        this.interiorView = undefined;
        this.vfxView = undefined;
        this.laserThreatsView = undefined;
        this.incomingMissilesView = undefined;
        this.spaceView = undefined;
    }
}
