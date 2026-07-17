// src/app/scenes/game/bridge/view/vfx/BridgeVfxView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeViewscreenDustView from './viewscreen_dust/BridgeViewscreenDustView';

// Root view для bridge VFX layer.
// Собирает vfx child views и переводит bridge events в локальные visual effects.
export default class BridgeVfxView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly viewscreenDustView: BridgeViewscreenDustView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('vfx').add(this.root);

        this.viewscreenDustView = new BridgeViewscreenDustView(this.scene, this.root);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.startViewscreenDust, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.stopViewscreenDust, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.startViewscreenDust, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.stopViewscreenDust, this);

        this.viewscreenDustView.destroy();
        this.root.destroy(false);
    }

    private startViewscreenDust(): void {
        this.viewscreenDustView.start();
    }

    private stopViewscreenDust(): void {
        this.viewscreenDustView.stop();
    }
}
