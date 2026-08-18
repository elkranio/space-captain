// src\app\scenes\game\init\InitScene.ts
import BaseScene from "../../BaseScene";
import LayerManager from "../../../../system/LayerManager";
import { SCENE_KEY } from "../../scene_key";
import InitController from "./controller/InitController";

const layers = ["bg", "ui"] as const;
type LayerKeys = (typeof layers)[number];

export default class InitScene extends BaseScene<LayerKeys> {
    private controller!: InitController;

    constructor() {
        super(SCENE_KEY.INIT);
    }

    protected createLayerManager(): LayerManager<LayerKeys> {
        return new LayerManager(this, layers);
    }

    protected start(): void {
        this.controller = new InitController(this);
        this.controller.start();
    }
}
