import type BridgeScene from "../../BridgeScene";
import { BRIDGE_OFFICER_STATION_LAYOUT } from "./bridge_officer_station_layout";
import BridgeOfficerStationView from "./station/BridgeOfficerStationView";

// Root view for the four bridge officer monitors.
// Portraits and monitor frames are layered independently over the bridge interior.
export default class BridgeOfficerStationsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationViews: BridgeOfficerStationView[] = [];

    constructor(private readonly scene: BridgeScene) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get("bridge").add(this.root);

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
            const stationView = new BridgeOfficerStationView(this.scene, this.root, layout);

            this.stationViews.push(stationView);
        }
    }
}
