// src\app\scenes\game\bridge\view\BridgeView.ts
import type BridgeScene from '../BridgeScene';
import BridgeInteriorView from './interior/BridgeInteriorView';

export default class BridgeView {
    private interiorView?: BridgeInteriorView;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.interiorView = new BridgeInteriorView(this.scene);
    }

    public destroy(): void {
        this.interiorView?.destroy();
        this.interiorView = undefined;
    }
}
