import type BridgeScene from '../../BridgeScene';
import type BridgeEventBus from '../../events/BridgeEventBus';
import { BRIDGE_OFFICER_STATION_LAYOUT } from './bridge_officer_station_layout';
import BridgeOfficerStationView from './station/BridgeOfficerStationView';

// Root view for the four modular bridge stations.
export default class BridgeOfficerStationsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationViews: BridgeOfficerStationView[] = [];

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get('bridge').add(this.root);

        this.createStationViews();
    }

    public destroy(): void {
        for (const stationView of this.stationViews) {
            stationView.destroy();
        }

        this.stationViews.length = 0;
        this.root.destroy(false);
    }

    private createStationViews(): void {
        for (const layout of Object.values(BRIDGE_OFFICER_STATION_LAYOUT)) {
            this.stationViews.push(new BridgeOfficerStationView(this.scene, this.root, layout, this.eventBus));
        }
    }
}
