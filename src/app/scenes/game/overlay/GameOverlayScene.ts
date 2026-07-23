// src/app/scenes/game/overlay/GameOverlayScene.ts

import LayerManager from '../../../../system/LayerManager';
import BaseScene from '../../BaseScene';
import { SCENE_KEY } from '../../scene_key';
import GameOverlayController from './controller/GameOverlayController';

const layers = ['ui'] as const;
type LayerKeys = (typeof layers)[number];

export default class GameOverlayScene extends BaseScene<LayerKeys> {
    private controller?: GameOverlayController;

    constructor() {
        super(SCENE_KEY.GAME_OVERLAY);
    }

    protected createLayerManager(): LayerManager<LayerKeys> {
        return new LayerManager(this, layers);
    }

    protected start(): void {
        this.controller = new GameOverlayController(this);
        this.controller.prepare();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.controller?.destroy();
            this.controller = undefined;
        });
    }
}
