// src/app/scenes/game/bridge/view/BridgeView.ts

import type BridgeScene from '../BridgeScene';
import type BridgeEventBus from '../events/BridgeEventBus';
import BridgeCrewView from './crew/BridgeCrewView';
import BridgeInteriorView from './interior/BridgeInteriorView';
import BridgeSpaceBackgroundView from './space/BridgeSpaceBackgroundView';
import BridgeObjectsView from './objects/BridgeObjectsView';
import BridgeVfxView from './vfx/BridgeVfxView';
import BridgeUiView from './ui/BridgeUiView';
import BridgeOfficerBarksView from './barks/BridgeOfficerBarksView';

export default class BridgeView {
    private interiorView?: BridgeInteriorView;
    private crewView?: BridgeCrewView;
    private spaceBackgroundView?: BridgeSpaceBackgroundView;
    private objectsView?: BridgeObjectsView;
    private vfxView?: BridgeVfxView;
    private uiView?: BridgeUiView;
    private officerBarksView?: BridgeOfficerBarksView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {}

    public prepare(): void {
        this.spaceBackgroundView = new BridgeSpaceBackgroundView(this.scene);
        this.objectsView = new BridgeObjectsView(this.scene, this.eventBus);
        this.vfxView = new BridgeVfxView(this.scene, this.eventBus);
        this.interiorView = new BridgeInteriorView(this.scene);
        this.crewView = new BridgeCrewView(this.scene, this.eventBus);
        this.uiView = new BridgeUiView(this.scene, this.eventBus);
        this.officerBarksView = new BridgeOfficerBarksView(this.scene, this.eventBus);
    }

    public destroy(): void {
        this.uiView?.destroy();
        this.crewView?.destroy();
        this.interiorView?.destroy();
        this.vfxView?.destroy();
        this.objectsView?.destroy();
        this.spaceBackgroundView?.destroy();
        this.officerBarksView?.destroy();

        this.uiView = undefined;
        this.crewView = undefined;
        this.interiorView = undefined;
        this.vfxView = undefined;
        this.objectsView = undefined;
        this.spaceBackgroundView = undefined;
        this.officerBarksView = undefined;
    }
}
