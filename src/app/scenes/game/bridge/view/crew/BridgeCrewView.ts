// src\app\scenes\game\bridge\view\crew\BridgeCrewView.ts

import type BridgeScene from '../../BridgeScene';
import { BRIDGE_CREW_POSITIONS } from './bridge_crew_layout';
import BridgeSeatView from './seat/BridgeSeatView';

export default class BridgeCrewView {
    private readonly root: Phaser.GameObjects.Container;
    private readonly seats: BridgeSeatView[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bridge').add(this.root);

        this.createSeats();
    }

    public destroy(): void {
        for (const seat of this.seats) {
            seat.destroy();
        }

        this.seats.length = 0;
        this.root.destroy(true);
    }

    private createSeats(): void {
        for (const position of BRIDGE_CREW_POSITIONS) {
            this.seats.push(new BridgeSeatView(this.scene, this.root, position));
        }
    }
}
