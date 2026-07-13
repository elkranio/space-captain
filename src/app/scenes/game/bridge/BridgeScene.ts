// src/app/scenes/game/bridge/BridgeScene.ts

import BaseScene from '../../BaseScene';
import LayerManager from '../../../../system/LayerManager';
import { SCENE_KEY } from '../../scene_key';
import BridgeController from './controller/BridgeController';

const layers = ['space', 'objects', 'vfx', 'bridge', 'ui'] as const;
type LayerKeys = (typeof layers)[number];

export default class BridgeScene extends BaseScene<LayerKeys> {
    private controller?: BridgeController;

    constructor() {
        super(SCENE_KEY.BRIDGE);
    }

    public update(_time: number, delta: number): void {
        this.controller?.step(delta);
    }

    protected createLayerManager(): LayerManager<LayerKeys> {
        return new LayerManager(this, layers);
    }

    protected start(): void {
        this.controller = new BridgeController(this);
        this.controller.prepare();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.controller?.destroy();
            this.controller = undefined;
        });
    }
}
