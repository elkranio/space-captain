// src\app\scenes\game\bridge\view\BridgeView.ts

import type BridgeScene from '../BridgeScene';
import BridgeInteriorView from './interior/BridgeInteriorView';
import BridgeCrewView from './crew/BridgeCrewView';

export default class BridgeView {
    private interiorView?: BridgeInteriorView;
    private crewView?: BridgeCrewView;

    constructor(private readonly scene: BridgeScene) {}

    public prepare(): void {
        this.interiorView = new BridgeInteriorView(this.scene);
        this.crewView = new BridgeCrewView(this.scene);
    }

    public destroy(): void {
        this.crewView?.destroy();
        this.interiorView?.destroy();

        this.crewView = undefined;
        this.interiorView = undefined;
    }
}
