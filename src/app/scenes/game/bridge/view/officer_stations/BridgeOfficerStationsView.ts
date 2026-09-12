import type { OfficerRole } from "../../../../../../engine/defs/officer";
import type BridgeScene from "../../BridgeScene";
import {
    BRIDGE_EVENT,
    type BridgeOfficerStationsUpdatedPayload,
} from "../../events/bridge_event";
import type BridgeEventBus from "../../events/BridgeEventBus";
import { BRIDGE_OFFICER_STATION_LAYOUT } from "./bridge_officer_station_layout";
import BridgeOfficerStationView from "./station/BridgeOfficerStationView";

// Root view for the four bridge officer stations.
// Monitor frames stay baked into bridge interior; portraits are separate stateful images.
export default class BridgeOfficerStationsView {
    private readonly root: Phaser.GameObjects.Container;

    private readonly stationViews = new Map<OfficerRole, BridgeOfficerStationView>();

    constructor(
        private readonly scene: BridgeScene,
        private readonly eventBus: BridgeEventBus,
    ) {
        this.root = this.scene.add.container(0, 0);
        this.scene.layers.get("bridge").add(this.root);

        this.createStationViews();

        this.eventBus.on(BRIDGE_EVENT.OFFICER_STATIONS_UPDATED, this.handleStationsUpdated, this);
    }

    public destroy(): void {
        this.eventBus.off(BRIDGE_EVENT.OFFICER_STATIONS_UPDATED, this.handleStationsUpdated, this);

        for (const stationView of this.stationViews.values()) {
            stationView.destroy();
        }

        this.stationViews.clear();
        this.root.destroy(false);
    }

    private createStationViews(): void {
        for (const layout of Object.values(BRIDGE_OFFICER_STATION_LAYOUT)) {
            const stationView = new BridgeOfficerStationView(this.scene, this.root, layout);

            this.stationViews.set(layout.role, stationView);
        }
    }

    private handleStationsUpdated(payload: BridgeOfficerStationsUpdatedPayload): void {
        for (const [role, stationView] of this.stationViews) {
            stationView.setState(payload[role]);
        }
    }
}
