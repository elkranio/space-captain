// src/app/scenes/game/bridge/BridgeScene.ts

import BaseScene from "../../BaseScene";
import LayerManager from "../../../../system/LayerManager";
import { SCENE_KEY } from "../../scene_key";
import BridgeController from "./controller/BridgeController";
import { installBridgeScreenPostFx } from "./view/screen_fx/BridgeScreenPostFx";

const layers = ["space", "objects", "vfx", "projection", "ui_blocker", "bridge", "ui"] as const;
type LayerKeys = (typeof layers)[number];

export default class BridgeScene extends BaseScene<LayerKeys> {
    private controller?: BridgeController;

    private removeScreenPostFx?: () => void;

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
        this.removeScreenPostFx = installBridgeScreenPostFx(this);
        this.controller = new BridgeController(this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.removeScreenPostFx?.();
            this.removeScreenPostFx = undefined;

            this.controller?.destroy();
            this.controller = undefined;
        });
    }
}
