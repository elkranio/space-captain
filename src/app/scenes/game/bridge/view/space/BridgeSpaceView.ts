// src/app/scenes/game/bridge/view/space/BridgeSpaceView.ts

import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import BridgeObjectsView from '../objects/BridgeObjectsView';
import BridgeSpaceBackgroundView from './BridgeSpaceBackgroundView';

// Составной view мира за bridge viewscreen.
//
// Владеет space background и encounter objects,
// а также локально связывает их animation motion.
export default class BridgeSpaceView {
    private readonly backgroundView: BridgeSpaceBackgroundView;
    private readonly objectsView: BridgeObjectsView;

    constructor(scene: BridgeScene, eventBus: BridgeEventBus) {
        this.backgroundView = new BridgeSpaceBackgroundView(scene);

        this.objectsView = new BridgeObjectsView(
            scene,
            eventBus,

            (screenX, screenY) => {
                this.backgroundView.panBy(screenX, screenY);
            },
        );
    }

    public destroy(): void {
        this.objectsView.destroy();
        this.backgroundView.destroy();
    }
}
