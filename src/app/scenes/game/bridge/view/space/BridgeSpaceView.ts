// src/app/scenes/game/bridge/view/space/BridgeSpaceView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeObjectsView from '../objects/BridgeObjectsView';
import BridgeSpaceBackgroundView from './BridgeSpaceBackgroundView';

// Составной view мира за bridge viewscreen.
//
// Владеет background и encounter objects,
// а также локально связывает их camera motion.
export default class BridgeSpaceView {
    private readonly backgroundView: BridgeSpaceBackgroundView;

    private readonly objectsView: BridgeObjectsView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.backgroundView = new BridgeSpaceBackgroundView(scene);

        this.objectsView = new BridgeObjectsView(
            scene,
            eventBus,

            (yawDeltaDegrees) => {
                this.backgroundView.turnYawBy(yawDeltaDegrees);
            },
        );
    }

    public destroy(): void {
        this.objectsView.destroy();
        this.backgroundView.destroy();
    }
}
