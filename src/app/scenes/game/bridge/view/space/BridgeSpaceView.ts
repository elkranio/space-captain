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

    constructor(
        scene: BridgeScene,
        eventBus: BridgeEventBus,
        setTransientWorldOffsetX: (offsetX: number) => void,
    ) {
        this.backgroundView = new BridgeSpaceBackgroundView(scene);

        this.objectsView = new BridgeObjectsView(
            scene,
            eventBus,

            (yawDeltaDegrees, transientWorldOffsetX) => {
                this.backgroundView.turnYawBy(yawDeltaDegrees);
                setTransientWorldOffsetX(transientWorldOffsetX);
            },
        );
    }

    public getObjectPosition(objectId: string): Phaser.Math.Vector2 | undefined {
        return this.objectsView.getObjectPosition(objectId);
    }

    public destroy(): void {
        this.objectsView.destroy();
        this.backgroundView.destroy();
    }
}
