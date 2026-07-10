// src\app\scenes\game\bridge\controller\BridgeController.ts

import type BridgeScene from '../BridgeScene';
import BridgeView from '../view/BridgeView';

export default class BridgeController {
    private view?: BridgeView;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.view = new BridgeView(this.scene);
        this.view.prepare();
    }

    public step(deltaMs: number): void {
        // Later:
        // const events = this.engine.tick(deltaMs);
        // this.handleDomainEvents(events);

        void deltaMs;
    }

    public destroy(): void {
        this.view?.destroy();
        this.view = undefined;
    }
}
