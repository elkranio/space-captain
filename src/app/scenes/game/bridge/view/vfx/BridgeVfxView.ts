// src\app\scenes\game\bridge\view\vfx\BridgeVfxView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_EVENT } from '../../events/bridge_event';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeArrivalDustView from './arrival/BridgeArrivalDustView';

export default class BridgeVfxView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly arrivalDustView: BridgeArrivalDustView;

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('vfx').add(this.root);

        this.arrivalDustView = new BridgeArrivalDustView(this.scene, this.root);

        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleEncounterArrivalStarted, this);
        this.eventBus.on(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_STARTED, this.handleEncounterArrivalStarted, this);
        this.eventBus.off(BRIDGE_EVENT.ENCOUNTER_ARRIVAL_COMPLETED, this.handleEncounterArrivalCompleted, this);

        this.arrivalDustView.destroy();
        this.root.destroy(true);
    }

    private handleEncounterArrivalStarted(): void {
        this.arrivalDustView.start();
    }

    private handleEncounterArrivalCompleted(): void {
        this.arrivalDustView.stop();
    }
}
