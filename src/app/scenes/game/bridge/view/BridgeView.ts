// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from '../BridgeScene';
import type BridgeEventBus from '../events/BridgeEventBus';
import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';
import BridgeCrewView from './crew/BridgeCrewView';
import BridgeInteriorView from './interior/BridgeInteriorView';
import BridgeSpaceView from './space/BridgeSpaceView';
import BridgeUiView from './ui/BridgeUiView';
import BridgeVfxView from './vfx/BridgeVfxView';

// Root view bridge scene.
// Собирает визуальные модули bridge и отвечает только за их lifecycle.
export default class BridgeView {
    private interiorView?: BridgeInteriorView;
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
        this.spaceView = new BridgeSpaceView(this.scene, this.eventBus);

        this.vfxView = new BridgeVfxView(this.scene, this.eventBus);

        this.interiorView = new BridgeInteriorView(this.scene);

        this.crewView = new BridgeCrewView(this.scene, this.eventBus);

        this.uiView = new BridgeUiView(this.scene, this.eventBus);

        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.officerBarksView?.destroy();
        this.uiView?.destroy();
        this.crewView?.destroy();
        this.interiorView?.destroy();
        this.vfxView?.destroy();
        this.spaceView?.destroy();

        this.officerBarksView = undefined;
        this.uiView = undefined;
        this.crewView = undefined;
        this.interiorView = undefined;
        this.vfxView = undefined;
        this.spaceView = undefined;
    }
}
