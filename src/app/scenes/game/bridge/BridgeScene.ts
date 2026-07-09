// src\app\scenes\game\bridge\BridgeScene.ts

import BaseScene from '../../BaseScene';
import LayerManager from '../../../../system/LayerManager';
import { SCENE_KEY } from '../../scene_key';

const layers = ['bg', 'ui'] as const;
type LayerKeys = (typeof layers)[number];

export default class BridgeScene extends BaseScene<LayerKeys> {
    constructor() {
        super(SCENE_KEY.BRIDGE);
    }

    protected createLayerManager(): LayerManager<LayerKeys> {
        return new LayerManager(this, layers);
    }

    protected start(): void {
        console.log('Bridge scene started');
    }
}
