// src/app/scenes/game/bridge/BridgeScene.ts

import BaseScene from '../../BaseScene';
import LayerManager from '../../../../system/LayerManager';
import { SCENE_KEY } from '../../scene_key';
import BridgeController from './controller/BridgeController';
import BridgeEvadeDebugView from './debug_view/evade/BridgeEvadeDebugView';
import BridgeEnemyEvadeDebugView from './debug_view/enemy_evade/BridgeEnemyEvadeDebugView';

const layers = ['space', 'objects', 'vfx', 'projection', 'ui_blocker', 'bridge', 'barks', 'ui'] as const;
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

        // Temporary visual sandbox.
        //
        // BridgeMissileDebugView intentionally remains in debug_view,
        // but is not mounted while E is used for Evade motion iteration.
        const evadeDebugView =
            new BridgeEvadeDebugView(this);

        const enemyEvadeDebugView =
            new BridgeEnemyEvadeDebugView(this);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            enemyEvadeDebugView.destroy();
            evadeDebugView.destroy();

            this.controller?.destroy();
            this.controller = undefined;
        });
    }
}
