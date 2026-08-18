// src/app/scenes/game/end/EndScene.ts

import BaseScene from "../../BaseScene";
import LayerManager from "../../../../system/LayerManager";
import { SCENE_KEY } from "../../scene_key";

const layers = [] as const;
type LayerKeys = (typeof layers)[number];

export default class EndScene extends BaseScene<LayerKeys> {
    constructor() {
        super(SCENE_KEY.END);
    }

    protected createLayerManager(): LayerManager<LayerKeys> {
        return new LayerManager(this, layers);
    }

    protected start(): void {
        console.log("You've reached the end");
    }
}
